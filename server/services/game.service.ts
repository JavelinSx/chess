import Game from '~/server/db/models/game.model';
import User from '~/server/db/models/user.model';
import GameCache from '../utils/GameCache';
import UserListCache from '../utils/UserListCache';
import { UserService } from './user.service';
import { gameSSEManager } from '../utils/sseManager/GameSSEManager';
import { userSSEManager } from '../utils/sseManager/UserSSEManager';
import { calculateEloChange, initializeBoard, updateGameStats } from '~/server/utils/services/gameServiceUtils';
import type { GameResult, ChessGame, PieceColor, TimeControl, GamePlayer, GameResultReason } from '../types/game';
import type { ClientUser, IUser } from '../types/user';
import type { ApiResponse } from '../types/api';

export class GameService {
  private static assignPlayers(
    inviter: IUser,
    invitee: IUser,
    startColor: 'white' | 'black' | 'random'
  ): { white: GamePlayer; black: GamePlayer } {
    const createGamePlayer = (user: IUser): GamePlayer => ({
      _id: user._id.toString(),
      username: user.username,
      avatar: user.avatar,
      rating: user.rating,
      gameStats: user.stats,
    });

    const isInviteeWhite = startColor === 'random' ? Math.random() < 0.5 : startColor === 'white';

    return {
      white: createGamePlayer(isInviteeWhite ? invitee : inviter),
      black: createGamePlayer(isInviteeWhite ? inviter : invitee),
    };
  }

  static async createGame(
    inviterId: string,
    inviteeId: string,
    timeControl: TimeControl,
    startColor: 'white' | 'black' | 'random' = 'random'
  ): Promise<ApiResponse<ChessGame>> {
    try {
      const [inviter, invitee] = await Promise.all([User.findById(inviterId), User.findById(inviteeId)]);

      if (!inviter || !invitee) {
        return { data: null, error: 'Players not found' };
      }

      const players = this.assignPlayers(inviter, invitee, startColor);
      const initialTime = timeControl.type === 'timed' ? (timeControl.initialTime || 0) * 60 : 0;
      const newGame = new Game({
        board: initializeBoard(),
        currentTurn: 'white',
        players,
        status: 'waiting',
        moveCount: 0,
        halfMoveClock: 0,
        enPassantTarget: null,
        positions: [],
        castlingRights: {
          whiteKingSide: true,
          whiteQueenSide: true,
          blackKingSide: true,
          blackQueenSide: true,
        },
        isCheck: false,
        isCheckmate: false,
        isStalemate: false,
        checkingPieces: [],
        capturedPieces: {
          white: [],
          black: [],
        },
        moveHistory: [],
        timeControl,
        startedAt: new Date(),
        whiteTime: initialTime,
        blackTime: initialTime,
        lastTimerUpdate: Date.now(),
      });

      const savedGame = await newGame.save();

      // Кэширование и обновление статусов
      const ttl = this.getGameCacheTTL(savedGame);
      GameCache.set(savedGame._id.toString(), savedGame.toObject(), ttl);

      UserListCache.updateUserStatus(inviterId, true, true);
      UserListCache.updateUserStatus(inviteeId, true, true);

      return { data: savedGame, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create game',
      };
    }
  }

  static async getGame(gameId: string): Promise<ApiResponse<ChessGame>> {
    try {
      let game = GameCache.get<ChessGame>(gameId);

      if (!game) {
        const dbGame = await Game.findById(gameId);
        if (!dbGame) {
          return { data: null, error: 'Game not found' };
        }
        game = dbGame.toObject();
        const ttl = this.getGameCacheTTL(game);
        GameCache.set(gameId, game, ttl);
      }

      return { data: game, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  static async saveGame(game: ChessGame): Promise<ApiResponse<void>> {
    try {
      const updatedGame = await Game.findByIdAndUpdate(game._id, game, { new: true });

      if (!updatedGame) {
        return { data: null, error: 'Game not found' };
      }

      const ttl = this.getGameCacheTTL(updatedGame);
      GameCache.set(updatedGame._id.toString(), updatedGame.toObject(), ttl);

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  static async updateGameStatus(
    gameId: string,
    status: 'waiting' | 'active' | 'completed'
  ): Promise<ApiResponse<void>> {
    try {
      await Game.findByIdAndUpdate(gameId, { status });
      const gameResponse = await this.getGame(gameId);

      if (gameResponse.error) {
        return { data: null, error: gameResponse.error };
      }

      const game = gameResponse.data!;
      game.status = status;

      const ttl = this.getGameCacheTTL(game);
      GameCache.set(gameId, game, ttl);

      return { data: undefined, error: null };
    } catch (error) {
      console.error('Error updating game status:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  private static getGameCacheTTL(game: ChessGame): number {
    if (game.timeControl && game.timeControl.type === 'timed' && game.timeControl.initialTime) {
      return game.timeControl.initialTime * 60 + 3600; // время игры + 1 час
    }
    return 24 * 3600; // 24 часа по умолчанию
  }

  static async endGame(gameId: string, result: GameResult): Promise<ApiResponse<GameResult>> {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        return { data: null, error: 'Game not found' };
      }

      if (game.status === 'completed') {
        return {
          data: game.result as GameResult,
          error: null,
        };
      }

      game.status = 'completed';
      game.result = result;
      await game.save();

      // Обновляем статистику игроков и получаем изменения рейтинга
      const ratingChanges = await this.updatePlayersStats(game, result);
      const finalResult = { ...result, ratingChanges };

      await this.updateCacheAndBroadcast(gameId, game, finalResult);

      await gameSSEManager.broadcastTimerSync(gameId, {
        whiteTime: game.whiteTime,
        blackTime: game.blackTime,
        activeColor: game.currentTurn,
        gameId: game._id.toString(),
        status: 'completed',
        timestamp: Date.now(),
      });

      return { data: finalResult, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  private static async updatePlayersStats(game: ChessGame, result: GameResult): Promise<Record<string, number>> {
    const whitePlayer = game.players.white;
    const blackPlayer = game.players.black;

    if (!whitePlayer || !blackPlayer) {
      throw new Error('Players not found in game data');
    }

    const [whiteUser, blackUser] = await Promise.all([
      User.findById(whitePlayer._id).lean(),
      User.findById(blackPlayer._id).lean(),
    ]);

    if (!whiteUser || !blackUser) {
      throw new Error('Players not found in database');
    }

    const isWhiteWinner = result.winner?._id === whitePlayer._id;
    const ratingChanges: Record<string, number> = {};

    const whiteOutcome =
      result.reason === 'forfeit'
        ? isWhiteWinner
          ? 'forfeit_win'
          : 'forfeit_loss'
        : result.reason === 'draw'
        ? 'draw'
        : isWhiteWinner
        ? 'win'
        : 'loss';

    const blackOutcome =
      result.reason === 'forfeit'
        ? !isWhiteWinner
          ? 'forfeit_win'
          : 'forfeit_loss'
        : result.reason === 'draw'
        ? 'draw'
        : !isWhiteWinner
        ? 'win'
        : 'loss';

    // Обновляем статистику игроков
    const whiteStats = await updateGameStats(whiteUser.stats, game, isWhiteWinner, 'white');
    const blackStats = await updateGameStats(blackUser.stats, game, !isWhiteWinner, 'black');

    const whiteRatingChange = calculateEloChange(whiteUser.rating, blackUser.rating, whiteOutcome);
    const blackRatingChange = calculateEloChange(blackUser.rating, whiteUser.rating, blackOutcome);

    const newWhiteRating = Math.max(0, whiteUser.rating + whiteRatingChange);
    const newBlackRating = Math.max(0, blackUser.rating + blackRatingChange);

    ratingChanges[whitePlayer._id] = newWhiteRating - whiteUser.rating;
    ratingChanges[blackPlayer._id] = newBlackRating - blackUser.rating;

    // Обновляем пользователей в БД с новой статистикой
    await Promise.all([
      User.findByIdAndUpdate(
        whitePlayer._id,
        {
          $set: {
            rating: newWhiteRating,
            stats: whiteStats,
          },
        },
        { new: true }
      ),
      User.findByIdAndUpdate(
        blackPlayer._id,
        {
          $set: {
            rating: newBlackRating,
            stats: blackStats,
          },
        },
        { new: true }
      ),
    ]);

    UserListCache.updateUser(whitePlayer._id, { rating: newWhiteRating, stats: whiteStats });
    UserListCache.updateUser(blackPlayer._id, { rating: newBlackRating, stats: blackStats });

    return ratingChanges;
  }

  private static async updateCacheAndBroadcast(
    gameId: string,
    game: ChessGame,
    finalResult: GameResult
  ): Promise<void> {
    await Promise.all([
      gameSSEManager.broadcastGameUpdate(gameId, game),
      gameSSEManager.sendGameEndNotification(gameId, finalResult),
    ]);

    GameCache.del(gameId);

    // Обновляем рейтинги в кэше
    if (finalResult.ratingChanges) {
      for (const [userId, ratingChange] of Object.entries(finalResult.ratingChanges)) {
        const user = UserListCache.getUserById(userId);
        if (user) {
          UserListCache.updateUser(userId, {
            ...user,
            rating: user.rating + ratingChange,
          });
        }
      }
    }

    const updatedUserList = UserListCache.getAllUsers().map((user) => ({
      ...user,
      _id: user._id.toString(),
      isOnline: true,
      isGame: false,
    }));

    await userSSEManager.broadcastUserListUpdate(updatedUserList);
  }

  static async updateGameTimer(gameId: string, whiteTime: number, blackTime: number): Promise<ApiResponse<void>> {
    try {
      const game = await this.getGame(gameId);
      if (!game.data) {
        return { data: null, error: 'Game not found' };
      }

      game.data.whiteTime = whiteTime;
      game.data.blackTime = blackTime;
      game.data.lastTimerUpdate = Date.now();
      const ttl = this.getGameCacheTTL(game.data);
      GameCache.set(gameId, game.data, ttl);
      // Отправляем обновление всем клиентам
      await gameSSEManager.broadcastTimerSync(gameId, {
        whiteTime: game.data.whiteTime,
        blackTime: game.data.blackTime,
        activeColor: game.data.currentTurn,
        gameId: game.data._id,
        status: game.data.status,
        timestamp: Date.now(),
      });

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update game timer',
      };
    }
  }

  static async handleTimeout(gameId: string, userId: string, color: PieceColor): Promise<ApiResponse<void>> {
    try {
      const game = await Game.findById(gameId);
      if (!game || game.status === 'completed') {
        return { data: null, error: 'Game not found or already completed' };
      }

      const { white, black } = game.players;
      if (!white || !black) {
        return { data: undefined, error: 'Error game.players' };
      }

      const result: GameResult = {
        winner: {
          _id: color === 'white' ? black._id : white._id,
          username: color === 'white' ? black.username : white.username,
          avatar: color === 'white' ? black.avatar : white.avatar,
        },
        loser: {
          _id: userId,
          username: color === 'white' ? white.username : black.username,
          avatar: color === 'white' ? white.avatar : black.avatar,
        },
        reason: 'timeout',
      };

      await this.endGame(gameId, result);
      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to handle game timeout',
      };
    }
  }
}
