import { Types } from 'mongoose';
import Game from '~/server/db/models/game.model';
import User from '~/server/db/models/user.model';
import { UserService } from './user.service';
import { sseManager } from '~/server/utils/SSEManager';
import { performMove } from '~/features/game-logic/model/game-logic/move-execution';
import { isKingInCheck, isCheckmate } from '~/features/game-logic/model/game-logic/check';
import { isDraw } from '~/features/game-logic/model/game-state/draw';
import { isCastling, isEnPassant, isPawnPromotion } from '~/features/game-logic/model/game-logic/special-moves';
import { updatePositionsHistory } from '~/features/game-logic/model/game-logic/utils';
import { initializeBoard, updatePlayerStats } from '~/server/utils/services/gameServiceUtils';
import type { GameResult, ChessGame, PieceColor, Position, MoveHistoryEntry } from '../types/game';
import type { ApiResponse } from '../types/api';
import type { UserStats } from '../types/user';

const gameCache = new Map<string, ChessGame>();

export class GameService {
  static async createGame(
    inviterId: string,
    inviteeId: string,
    timeControl: { type: 'timed' | 'untimed'; initialTime?: 15 | 30 | 45 | 90 }
  ): Promise<ApiResponse<ChessGame>> {
    try {
      const newGame = new Game({
        id: new Types.ObjectId().toString(),
        board: initializeBoard(),
        currentTurn: 'white',
        players: { white: null, black: null },
        status: 'waiting',
        winner: null,
        loser: null,
        inviterId,
        inviteeId,
        moveHistory: [],
        timeControl,
        startedAt: new Date(),
      });

      const savedGame = await newGame.save();
      return { data: savedGame.toObject(), error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async getGame(gameId: string): Promise<ApiResponse<ChessGame>> {
    try {
      let game = gameCache.get(gameId);
      if (!game) {
        const dbGame = await Game.findOne({ id: gameId }).lean();
        if (!dbGame) return { data: null, error: 'Game not found' };
        game = dbGame as ChessGame;
        gameCache.set(gameId, game);
      }

      if (!game.players || typeof game.players.white === 'undefined' || typeof game.players.black === 'undefined') {
        return { data: null, error: 'Invalid game data: players information is missing' };
      }

      return { data: game, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async saveGame(game: ChessGame): Promise<ApiResponse<void>> {
    try {
      await Game.findOneAndUpdate({ id: game.id }, game, { new: true });
      gameCache.set(game.id, game);
      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async updateGameStatus(
    gameId: string,
    status: 'waiting' | 'active' | 'completed'
  ): Promise<ApiResponse<void>> {
    try {
      await Game.findOneAndUpdate({ id: gameId }, { status });
      const gameResponse = await this.getGame(gameId);
      if (gameResponse.error) return { data: null, error: gameResponse.error };
      const game = gameResponse.data!;
      game.status = status;
      gameCache.set(gameId, game);
      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async setPlayerColor(gameId: string, userId: string, color: PieceColor): Promise<ApiResponse<void>> {
    try {
      await Game.findOneAndUpdate({ id: gameId }, { [`players.${color}`]: userId });
      const gameResponse = await this.getGame(gameId);
      if (gameResponse.error) return { data: null, error: gameResponse.error };
      const game = gameResponse.data!;
      game.players[color] = userId;
      gameCache.set(gameId, game);
      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async handleMove(gameId: string, from: Position, to: Position): Promise<ApiResponse<void>> {
    try {
      const gameResponse = await this.getGame(gameId);
      if (gameResponse.error) return { data: null, error: gameResponse.error };
      let game = gameResponse.data!;

      const updatedGame = performMove(game, from, to);
      const moveEntry = this.createMoveEntry(game, updatedGame, from, to);
      updatedGame.moveHistory.push(moveEntry);
      updatedGame.positions = updatePositionsHistory(updatedGame.positions, updatedGame.board);

      const checkStatus = isKingInCheck(updatedGame);
      updatedGame.isCheck = checkStatus.inCheck;
      updatedGame.checkingPieces = checkStatus.checkingPieces;

      if (updatedGame.isCheck && isCheckmate(updatedGame)) {
        this.handleGameEnd(updatedGame, 'checkmate');
      } else if (isDraw(updatedGame)) {
        this.handleGameEnd(updatedGame, 'draw');
      }

      const saveResponse = await this.saveGame(updatedGame);
      if (saveResponse.error) return saveResponse;

      await sseManager.broadcastGameUpdate(gameId, updatedGame);
      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  private static createMoveEntry(
    game: ChessGame,
    updatedGame: ChessGame,
    from: Position,
    to: Position
  ): MoveHistoryEntry {
    return {
      from,
      to,
      piece: game.board[from[0]][from[1]]!,
      capturedPiece: game.board[to[0]][to[1]] || undefined,
      isCheck: updatedGame.isCheck,
      isCheckmate: updatedGame.isCheckmate,
      isCastling: isCastling(game, from, to),
      isEnPassant: isEnPassant(game, from, to),
      isPromotion: isPawnPromotion(game.board, from, to),
      player: game.currentTurn === 'white' ? game.players.white! : game.players.black!,
    };
  }

  private static handleGameEnd(game: ChessGame, reason: 'checkmate' | 'draw'): void {
    game.status = 'completed';
    game.result = {
      winner: reason === 'checkmate' ? (game.currentTurn === 'white' ? game.players.black : game.players.white) : null,
      loser: reason === 'checkmate' ? (game.currentTurn === 'white' ? game.players.white : game.players.black) : null,
      reason,
    };
  }

  static async endGame(
    gameId: string,
    result: GameResult | { forfeitingPlayerId: string }
  ): Promise<ApiResponse<GameResult>> {
    const session = await Game.startSession();
    try {
      return await session.withTransaction(async () => {
        const gameResponse = await this.getGame(gameId);
        if (gameResponse.error) throw new Error(gameResponse.error);
        const game = gameResponse.data!;

        let finalResult: GameResult;

        if ('forfeitingPlayerId' in result) {
          const winner = game.players.white === result.forfeitingPlayerId ? game.players.black : game.players.white;
          finalResult = {
            winner,
            loser: result.forfeitingPlayerId,
            reason: 'forfeit',
          };
        } else {
          finalResult = result;
        }

        game.status = 'completed';
        game.result = finalResult;

        await Game.findOneAndUpdate({ id: gameId }, game).session(session);

        const [whitePlayer, blackPlayer] = await Promise.all([
          this.updatePlayerStats(game.players.white!, game, finalResult),
          this.updatePlayerStats(game.players.black!, game, finalResult),
        ]);

        await Promise.all([
          sseManager.sendUserUpdate(whitePlayer),
          sseManager.sendUserUpdate(blackPlayer),
          sseManager.sendGameEndNotification(gameId, finalResult),
          sseManager.broadcastUserListUpdate(await User.find().select('username isOnline').lean()),
          UserService.updateUserStatus(game.players.white!, true, false),
          UserService.updateUserStatus(game.players.black!, true, false),
        ]);

        return { data: finalResult, error: null };
      });
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    } finally {
      session.endSession();
    }
  }

  private static async updatePlayerStats(playerId: string, game: ChessGame, result: GameResult): Promise<any> {
    const player = await User.findById(playerId);
    if (!player) throw new Error('Player not found');

    const isWinner = playerId === result.winner;
    const playerColor = game.players.white === playerId ? 'white' : 'black';

    updatePlayerStats(player.stats, game, isWinner, playerColor);
    await player.save();

    return player;
  }

  static async updateGameStats(gameId: string, result: GameResult): Promise<ApiResponse<{ [key: string]: UserStats }>> {
    try {
      const gameResponse = await this.getGame(gameId);
      if (gameResponse.error) throw new Error(gameResponse.error);
      const game = gameResponse.data!;

      const [whitePlayer, blackPlayer] = await Promise.all([
        this.updatePlayerStats(game.players.white!, game, result),
        this.updatePlayerStats(game.players.black!, game, result),
      ]);

      return {
        data: {
          [game.players.white!]: whitePlayer.stats,
          [game.players.black!]: blackPlayer.stats,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }
}
