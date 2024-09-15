import { Types } from 'mongoose';
import Game from '~/server/db/models/game.model';
import User from '~/server/db/models/user.model';
import { sseManager } from '~/server/utils/SSEManager';
import { performMove } from '~/features/game-logic/model/game-logic/move-execution';

import type { GameResult, ChessGame, PieceColor, ChessBoard, PieceType } from '../types/game';
import type { Position } from '~/features/game-logic/model/pieces/types';

// Кэш для хранения активных игр
const gameCache = new Map<string, ChessGame>();

export class GameService {
  // Создание новой игры
  static async createGame(inviterId: string, inviteeId: string): Promise<ChessGame> {
    const newGame = new Game({
      id: new Types.ObjectId().toString(),
      board: this.initializeBoard(),
      currentTurn: 'white',
      players: { white: null, black: null },
      status: 'waiting',
      winner: null,
      inviterId,
      inviteeId,
    });

    const savedGame = await newGame.save();
    const game = savedGame.toObject();
    gameCache.set(game.id, game);
    return game;
  }

  // Получение игры из кэша или базы данных
  static async getGame(gameId: string): Promise<ChessGame> {
    let game = gameCache.get(gameId);
    if (!game) {
      game = (await Game.findOne({ id: gameId }).lean()) as ChessGame | undefined;
      if (!game) throw new Error('Game not found');
      gameCache.set(gameId, game);
    }
    return game;
  }

  // Сохранение игры в базу данных и обновление кэша
  static async saveGame(game: ChessGame): Promise<void> {
    await Game.findOneAndUpdate({ id: game.id }, game, { new: true });
    gameCache.set(game.id, game);
  }

  // Обновление статуса игры
  static async updateGameStatus(gameId: string, status: 'waiting' | 'active' | 'completed'): Promise<void> {
    await Game.findOneAndUpdate({ id: gameId }, { status });
    const game = await this.getGame(gameId);
    game.status = status;
    gameCache.set(gameId, game);
  }

  // Установка цвета игрока
  static async setPlayerColor(gameId: string, userId: string, color: PieceColor): Promise<void> {
    await Game.findOneAndUpdate({ id: gameId }, { [`players.${color}`]: userId });
    const game = await this.getGame(gameId);
    game.players[color] = userId;
    gameCache.set(gameId, game);
  }

  // Обработка хода
  static async handleMove(gameId: string, from: Position, to: Position): Promise<void> {
    const game = await this.getGame(gameId);
    const updatedGame = performMove(game, from, to);
    await this.saveGame(updatedGame);
    await sseManager.broadcastGameUpdate(gameId, updatedGame);
  }

  // Завершение игры
  static async endGame(gameId: string, result: GameResult): Promise<void> {
    const game = await this.getGame(gameId);
    game.status = 'completed';
    game.winner = result.winner;
    game.loser = result.loser;

    const session = await Game.startSession();
    try {
      await session.withTransaction(async () => {
        await Game.findOneAndUpdate({ id: gameId }, game).session(session);

        // Обновление статистики игроков
        const updatePromises = [game.players.white, game.players.black].map((playerId) =>
          User.findByIdAndUpdate(
            playerId,
            {
              $inc: {
                gamesPlayed: 1,
                gamesWon: playerId === result.winner ? 1 : 0,
                gamesLost: playerId === result.loser ? 1 : 0,
                gamesDraw: result.winner === null ? 1 : 0,
              },
            },
            { new: true, session }
          ).select('username gamesPlayed gamesWon gamesLost gamesDraw')
        );

        const [whitePlayer, blackPlayer] = await Promise.all(updatePromises);

        // Отправка обновлений через SSE
        await Promise.all([
          sseManager.sendUserUpdate(whitePlayer!),
          sseManager.sendUserUpdate(blackPlayer!),
          sseManager.sendGameEndNotification(gameId, result),
          sseManager.broadcastUserListUpdate(await User.find().select('username isOnline').lean()),
        ]);
      });
    } finally {
      session.endSession();
    }

    gameCache.delete(gameId);
  }

  // Принудительное завершение игры
  static async forcedEndGame(gameId: string, userId: string): Promise<void> {
    const game = await this.getGame(gameId);
    const winner = game.players.white === userId ? game.players.black : game.players.white;
    const result: GameResult = { winner, loser: userId, reason: 'forfeit' };
    await this.endGame(gameId, result);
  }

  // Инициализация доски
  private static initializeBoard(): ChessBoard {
    const board: ChessBoard = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));

    // Расставляем пешки
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: 'pawn', color: 'white' };
      board[6][i] = { type: 'pawn', color: 'black' };
    }

    // Расставляем остальные фигуры
    const piecesBlack: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    const piecesWhite: PieceType[] = ['rook', 'knight', 'bishop', 'king', 'queen', 'bishop', 'knight', 'rook'];
    for (let i = 0; i < 8; i++) {
      board[0][i] = { type: piecesBlack[i], color: 'white' };
      board[7][i] = { type: piecesWhite[i], color: 'black' };
    }

    return board;
  }
}
