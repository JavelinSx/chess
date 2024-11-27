import Game from '~/server/db/models/game.model';
import User from '~/server/db/models/user.model';
import GameCache from '../utils/GameCache';
import UserListCache from '../utils/UserListCache';
import { UserService } from './user.service';
import { gameSSEManager } from '../utils/sseManager/GameSSEManager';
import { userSSEManager } from '../utils/sseManager/UserSSEManager';
import { calculateEloChange, initializeBoard } from '~/server/utils/services/gameServiceUtils';
import type { GameResult, ChessGame, PieceColor, TimeControl, GamePlayer } from '../types/game';
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
      });

      const savedGame = await newGame.save();

      // Кэширование и обновление статусов
      const ttl = this.getGameCacheTTL(savedGame);
      GameCache.set(savedGame._id.toString(), savedGame.toObject(), ttl);

      await Promise.all([this.updateUserStatus(inviterId, true, true), this.updateUserStatus(inviteeId, true, true)]);

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

  private static async updateUserStatus(userId: string, isOnline: boolean, isGame: boolean): Promise<void> {
    await User.findByIdAndUpdate(userId, { isOnline, isGame });
    UserListCache.updateUserStatus(userId, isOnline, isGame);
    await userSSEManager.broadcastUserStatusUpdate(userId, { isOnline, isGame });
  }

  static async endGame(
    gameId: string,
    result: GameResult
  ): Promise<ApiResponse<GameResult & { ratingChanges: { [key: string]: number } }>> {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        return { data: null, error: 'Game not found' };
      }

      if (game.status === 'completed') {
        return {
          data: game.result as GameResult & { ratingChanges: { [key: string]: number } },
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

    const [whiteUser, blackUser] = await Promise.all([User.findById(whitePlayer._id), User.findById(blackPlayer._id)]);
    const whiteUserObject = whiteUser?.toObject();
    const blackUserObject = blackUser?.toObject();
    if (!whiteUserObject || !blackUserObject) {
      throw new Error('Players object not found in database');
    }
    if (!whiteUser || !blackUser) {
      throw new Error('Players not found in database');
    }

    const isWhiteWinner = result.winner === whitePlayer._id;
    const ratingChanges: Record<string, number> = {};

    // Рассчитываем изменения рейтинга
    ratingChanges[whitePlayer._id] = calculateEloChange(
      whiteUser.rating,
      blackUser.rating,
      isWhiteWinner ? 'win' : result.reason === 'draw' ? 'draw' : 'loss'
    );

    ratingChanges[blackPlayer._id] = calculateEloChange(
      blackUser.rating,
      whiteUser.rating,
      !isWhiteWinner ? 'win' : result.reason === 'draw' ? 'draw' : 'loss'
    );

    const whiteUserStats = await updateGameStats(whiteUser.stats, game, isWhiteWinner, 'white');
    const blackUserStats = await updateGameStats(blackUser.stats, game, !isWhiteWinner, 'black');

    // Обновляем статистику и рейтинги игроков
    whiteUserObject.stats = { ...whiteUser.stats, ...whiteUserStats };
    whiteUserObject.rating += ratingChanges[whitePlayer._id];

    blackUserObject.stats = { ...blackUser.stats, ...blackUserStats };
    blackUserObject.rating += ratingChanges[blackPlayer._id];

    await Promise.all([
      User.findByIdAndUpdate(whiteUser._id, whiteUserObject),
      User.findByIdAndUpdate(blackUser._id, blackUserObject),
    ]);

    // Обновляем кэш пользователей
    UserListCache.updateUser(whitePlayer._id, {
      ...whiteUser.toObject(),
      _id: whitePlayer._id,
    });
    UserListCache.updateUser(blackPlayer._id, {
      ...blackUser.toObject(),
      _id: blackPlayer._id,
    });

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

    const updatedUserList = UserListCache.getAllUsers().map((user) => ({
      ...user,
      _id: user._id.toString(),
    }));

    await userSSEManager.broadcastUserListUpdate(updatedUserList);
  }

  static async handleTimeout(gameId: string, userId: string, color: PieceColor): Promise<ApiResponse<void>> {
    try {
      const game = await Game.findById(gameId);
      if (!game || game.status === 'completed') {
        return { data: null, error: 'Game not found or already completed' };
      }
      if (game.players.black && game.players.white) {
        const result: GameResult = {
          winner: color === 'white' ? game.players.black._id : game.players.white._id,
          loser: userId,
          reason: 'timeout',
        };

        await this.endGame(gameId, result);
        return { data: undefined, error: null };
      } else {
        return { data: undefined, error: 'Error game.players' };
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to handle game timeout',
      };
    }
  }
}
