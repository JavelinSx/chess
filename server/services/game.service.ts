import { Types } from 'mongoose';
import Game from '~/server/db/models/game.model';
import User from '~/server/db/models/user.model';
import gameCache from '../utils/gameCache';
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

export class GameService {
  private static getGameCacheTTL(game: ChessGame): number {
    if (game.timeControl && game.timeControl.type === 'timed' && game.timeControl.initialTime) {
      return game.timeControl.initialTime * 60 + 3600;
    }
    // Для игр без ограничения по времени или неопределенных случаев используем значение по умолчанию
    return 24 * 3600; // 24 часа
  }

  static async createGame(
    inviterId: string,
    inviteeId: string,
    timeControl: { type: 'timed' | 'untimed'; initialTime?: 15 | 30 | 45 | 90 }
  ): Promise<ApiResponse<ChessGame>> {
    try {
      const isInviterWhite = Math.random() < 0.5;
      const players = {
        white: isInviterWhite ? inviterId : inviteeId,
        black: isInviterWhite ? inviteeId : inviterId,
      };
      const newGame = new Game({
        board: initializeBoard(),
        currentTurn: 'white',
        players: players,
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
      const ttl = this.getGameCacheTTL(savedGame);
      gameCache.set(savedGame._id.toString(), savedGame.toObject(), ttl);

      return { data: savedGame.toObject(), error: null };
    } catch (error) {
      console.error('Error creating game:', error);
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async getGame(gameId: string): Promise<ApiResponse<ChessGame>> {
    try {
      let game = gameCache.get(gameId) as ChessGame;
      if (!game) {
        console.log('hello11111111111111111111111111');
        const dbGame = await Game.findById(gameId);
        if (!dbGame) return { data: null, error: 'Game not found' };
        game = dbGame.toObject();
        const ttl = this.getGameCacheTTL(game);
        gameCache.set(gameId, game, ttl);
      }
      console.log('Retrieved game currentTurn:', game.currentTurn);
      return { data: game, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async saveGame(game: ChessGame): Promise<ApiResponse<void>> {
    try {
      const updatedGame = await Game.findByIdAndUpdate(game._id, game, { new: true });
      if (!updatedGame) {
        return { data: null, error: 'Game not found' };
      }
      const ttl = this.getGameCacheTTL(updatedGame);
      gameCache.set(updatedGame._id.toString(), updatedGame.toObject(), ttl);
      console.log('Saved game currentTurn:', updatedGame.currentTurn);
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
      await Game.findByIdAndUpdate(gameId, { status });
      const gameResponse = await this.getGame(gameId);

      if (gameResponse.error) return { data: null, error: gameResponse.error };
      const game = gameResponse.data!;
      game.status = status;

      const ttl = this.getGameCacheTTL(game);
      gameCache.set(gameId, game, ttl);

      return { data: undefined, error: null };
    } catch (error) {
      console.error('Error updating game status:', error);
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async setPlayerColor(gameId: string, userId: string, color: PieceColor): Promise<ApiResponse<void>> {
    try {
      await Game.findByIdAndUpdate(gameId, { [`players.${color}`]: userId });
      const gameResponse = await this.getGame(gameId);

      if (gameResponse.error) return { data: null, error: gameResponse.error };
      const game = gameResponse.data!;
      game.players[color] = userId;

      const ttl = this.getGameCacheTTL(game);
      gameCache.set(gameId, game, ttl);

      return { data: undefined, error: null };
    } catch (error) {
      console.error('Error setting player color:', error);
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

  static async endGame(gameId: string, result: GameResult): Promise<ApiResponse<GameResult>> {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      // Сначала отправляем уведомление о завершении игры
      await sseManager.sendGameEndNotification(gameId, result);

      // Затем обновляем статус игры и статистику игроков
      game.status = 'completed';
      game.result = result;
      await game.save();

      await Promise.all([
        this.updatePlayerStats(game.players.white!, game, result),
        this.updatePlayerStats(game.players.black!, game, result),
        UserService.updateUserStatus(game.players.white!, true, false),
        UserService.updateUserStatus(game.players.black!, true, false),
      ]);

      // Только после этого удаляем соединения
      sseManager.removeGameConnection(gameId, game.players.white!);
      sseManager.removeGameConnection(gameId, game.players.black!);

      // Очищаем кэш игры
      gameCache.del(gameId);

      return { data: result, error: null };
    } catch (error) {
      console.error('Error in GameService.endGame:', error);
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async handleDeletedUser(userId: string): Promise<void> {
    const games = await Game.find({ $or: [{ 'players.white': userId }, { 'players.black': userId }] });

    for (const game of games) {
      if (game.players.white === userId) {
        game.players.white = 'Deleted User';
      }
      if (game.players.black === userId) {
        game.players.black = 'Deleted User';
      }
      await game.save();
    }
  }

  private static async updatePlayerStats(playerId: string, game: ChessGame, result: GameResult): Promise<void> {
    const player = await User.findById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const isWinner = playerId === result.winner;
    const playerColor = game.players.white === playerId ? 'white' : 'black';

    updatePlayerStats(player.stats, game, isWinner, playerColor);
    await player.save();
  }
}
