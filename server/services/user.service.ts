import type { ClientUser, UserProfileResponse } from '../types/user';
import type { Friend } from '../types/friends';
import type { IUser, UserStats } from '../types/user';
import type { FlattenMaps } from 'mongoose';
import User from '../db/models/user.model';
import { sseManager } from '~/server/utils/SSEManager';
import { ChatService } from './chat.service';
import { GameService } from './game.service';
import type { ApiResponse } from '../types/api';

export class UserService {
  static async profileUpdate(id: string, username: string, email: string): Promise<ApiResponse<UserProfileResponse>> {
    try {
      const user = await User.findByIdAndUpdate(id, { username, email }, { new: true }).lean();

      if (!user) {
        return { data: null, error: 'User not found' };
      }

      const response: UserProfileResponse = {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        rating: user.rating,
        title: user.title,
        stats: user.stats,
        lastLogin: user.lastLogin,
        isOnline: user.isOnline,
        isGame: user.isGame,
        winRate: user.winRate,
        currentGameId: user.currentGameId,
        friends: user.friends,
        chatSetting: user.chatSetting,
      };

      return { data: response, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }
  static async deleteAccount(userId: string): Promise<ApiResponse<void>> {
    try {
      // Получаем пользователя
      const user = await User.findById(userId);
      if (!user) {
        return { data: null, error: 'User not found' };
      }

      // Обновляем чаты
      await ChatService.handleDeletedUser(userId);

      // Обновляем игры
      await GameService.handleDeletedUser(userId);

      // Удаляем пользователя из списков друзей других пользователей
      await User.updateMany({ friends: userId }, { $pull: { friends: userId } });

      // Удаляем запросы на добавление в друзья
      await User.updateMany({ 'friendRequests.from': userId }, { $pull: { friendRequests: { from: userId } } });
      await User.updateMany({ 'friendRequests.to': userId }, { $pull: { friendRequests: { to: userId } } });

      // Удаляем пользователя
      await User.findByIdAndDelete(userId);

      // Отправляем уведомление об удалении пользователя
      await sseManager.broadcastUserDeleted(userId);

      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }
  static async updateUserProfile(
    id: string,
    updateData: { username?: string; email?: string; chatSetting?: IUser['chatSetting'] }
  ): Promise<ApiResponse<void>> {
    try {
      const user = await User.findByIdAndUpdate(id, updateData, { new: true }).lean();

      if (!user) {
        return { data: null, error: 'User not found' };
      }

      if (updateData.chatSetting !== undefined) {
        await sseManager.sendUserUpdate(user);

        // Вызываем новый метод для обновления приватности чат-комнат
        const chatUpdateResult = await ChatService.updateUserChatPrivacy(id, updateData.chatSetting);
        if (chatUpdateResult.error) {
          return chatUpdateResult;
        }
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  static async getUsersList(): Promise<ApiResponse<ClientUser[]>> {
    try {
      const users = await User.find({});
      return { data: users, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async updateUserStatus(userId: string, isOnline: boolean, isGame: boolean): Promise<ApiResponse<void>> {
    try {
      await User.findByIdAndUpdate(userId, { isOnline, isGame });

      // Отправляем обновление статуса через SSE только если статус действительно изменился
      const user = await User.findById(userId);
      if (user && (user.isOnline !== isOnline || user.isGame !== isGame)) {
        await sseManager.broadcastUserStatusUpdate(userId, { isOnline, isGame });
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  static async updateUserStats(userId: string, statsUpdate: Partial<UserStats>): Promise<ApiResponse<void>> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { data: null, error: 'User not found' };
      }

      // Обновляем каждое поле статистики
      Object.keys(statsUpdate).forEach((key) => {
        if (key in user.stats) {
          (user.stats as any)[key] = (statsUpdate as any)[key];
        }
      });

      // Пересчитываем winRate
      if ('gamesWon' in statsUpdate || 'gamesPlayed' in statsUpdate) {
        user.winRate = user.stats.gamesWon / user.stats.gamesPlayed;
      }

      await user.save();
      await sseManager.sendUserUpdate(user);

      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async resetUserStats(userId: string): Promise<ApiResponse<void>> {
    try {
      const defaultStats: UserStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        gamesDraw: 0,
        discoveredChecks: 0,
        doubleChecks: 0,
        capturedPawns: 0,
        checksGiven: 0,
        castlingsMade: 0,
        promotions: 0,
        averageMovesPerGame: 0,
        longestGame: 0,
        shortestWin: Infinity,
        queenSacrifices: 0,
        enPassantCaptures: 0,
        averageRatingChange: 0,
        biggestRatingGain: 0,
        biggestRatingLoss: 0,
        winStreakBest: 0,
        currentWinStreak: 0,
        resignations: 0,
        gamesByDuration: {
          15: 0,
          30: 0,
          45: 0,
          90: 0,
        },
      };

      await User.findByIdAndUpdate(userId, { $set: { stats: defaultStats, winRate: 0 } });
      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async getUserById(userId: string): Promise<ApiResponse<IUser>> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { data: null, error: 'User not found' };
      }
      return { data: user, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async syncAllUsersStatus(): Promise<ApiResponse<void>> {
    try {
      const users = await User.find({});
      for (const user of users) {
        const isOnline = sseManager.isUserConnected(user._id.toString());
        if (user.isOnline !== isOnline) {
          user.isOnline = isOnline;
          await user.save();
          await this.updateUserStatus(user._id.toString(), isOnline, user.isGame);
        }
      }
      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async getUsersCount(): Promise<ApiResponse<number>> {
    try {
      const count = await User.countDocuments();
      return { data: count, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async getUsersWithPagination(
    page: number,
    perPage: number
  ): Promise<ApiResponse<{ users: ClientUser[]; totalCount: number }>> {
    try {
      const skip = (page - 1) * perPage;
      const users = await User.find().skip(skip).limit(perPage).lean();

      const totalCountResponse = await this.getUsersCount();
      if (totalCountResponse.error) {
        return { data: null, error: totalCountResponse.error };
      }
      const totalCount = totalCountResponse.data!;

      const clientUsers: ClientUser[] = users.map((user: FlattenMaps<IUser> & { _id: string }) => ({
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        rating: user.rating,
        title: user.title,
        stats: user.stats as UserStats,
        lastLogin: user.lastLogin,
        isOnline: user.isOnline,
        isGame: user.isGame,
        winRate: user.winRate,
        currentGameId: user.currentGameId,
        friends: (user.friends as any[]).map((friend: any) => ({
          _id: friend._id?.toString() || friend.toString(),
          username: '',
          isOnline: false,
          isGame: false,
        })) as Friend[],
        chatSetting: user.chatSetting,
      }));

      return {
        data: {
          users: clientUsers,
          totalCount,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }
}

if (import.meta.client) {
  setInterval(() => UserService.syncAllUsersStatus(), 6000);
}
