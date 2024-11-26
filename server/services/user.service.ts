// server/services/user.service.ts

import User from '../db/models/user.model';
import { userSSEManager } from '../utils/sseManager/UserSSEManager';
import UserListCache from '../utils/UserListCache';
import type { ClientUser, UserProfileResponse, UserStats } from '../types/user';
import type { ApiResponse } from '../types/api';

export class UserService {
  static isValidAvatarUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['https:', 'http:'].includes(parsed.protocol) && /\.(jpg|jpeg|png|webp|svg)$/i.test(parsed.pathname);
    } catch {
      return false;
    }
  }
  static async updateUserStatus(userId: string, isOnline: boolean, isGame: boolean): Promise<ApiResponse<void>> {
    try {
      await User.findByIdAndUpdate(userId, { isOnline, isGame });
      UserListCache.updateUserStatus(userId, isOnline, isGame);
      await userSSEManager.broadcastUserStatusUpdate(userId, { isOnline, isGame });
      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  static async syncAllUsersStatus(): Promise<ApiResponse<void>> {
    try {
      const users = await User.find({}, '_id isOnline isGame');
      for (const user of users) {
        const isOnline = userSSEManager.isUserConnected(user._id.toString());
        if (user.isOnline !== isOnline || user.isGame !== UserListCache.getUserById(user._id.toString())?.isGame) {
          await this.updateUserStatus(user._id.toString(), isOnline, user.isGame);
        }
      }
      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async profileUpdate(
    id: string,
    username: string,
    email: string,
    avatar: string
  ): Promise<ApiResponse<UserProfileResponse>> {
    try {
      const user = await User.findByIdAndUpdate(id, { username, email, avatar }, { new: true }).lean();
      if (!this.isValidAvatarUrl(avatar)) {
        throw new Error('Invalid avatar URL format');
      }
      if (!user) {
        return { data: null, error: 'User not found' };
      }

      const response: UserProfileResponse = {
        _id: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
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

      UserListCache.updateUser(id, response);
      await userSSEManager.sendUserUpdate(response);

      return { data: response, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async deleteAccount(userId: string): Promise<ApiResponse<void>> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { data: null, error: 'User not found' };
      }

      // Здесь добавьте логику для обновления чатов, игр и т.д.

      await User.findByIdAndDelete(userId);
      UserListCache.removeUser(userId);
      await userSSEManager.broadcastUserDeleted(userId);

      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async updateUserProfile(
    id: string,
    updateData: { username?: string; email?: string; chatSetting?: string; avatar?: string }
  ): Promise<ApiResponse<ClientUser>> {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        {
          username: updateData.username,
          email: updateData.email,
          chatSetting: updateData.chatSetting,
          avatar: updateData.avatar,
        },
        { new: true }
      ).lean();
      if (!user) {
        return { data: null, error: 'User not found' };
      }
      UserListCache.updateUser(id, user);
      await userSSEManager.sendUserUpdate(user);
      return { data: user as unknown as ClientUser, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  static async getUsersList(): Promise<ApiResponse<ClientUser[]>> {
    try {
      // let users = UserListCache.getAllUsers();
      // if (users.length === 0) {
      const dbUsers = await User.find({}).lean();
      const users = dbUsers.map((user) => ({
        _id: user._id.toString(),
        username: user.username,
        githubData: user.githubData,
        avatar: user.avatar,
        isOnline: user.isOnline,
        isGame: user.isGame,
        email: user.email,
        rating: user.rating,
        stats: user.stats,
        title: user.title,
        lastLogin: user.lastLogin,
        winRate: user.winRate,
        friends: user.friends,
        chatSetting: user.chatSetting,
      }));
      users.forEach((user) => UserListCache.addUser(user));
      // }
      return { data: users, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async updateUserStats(userId: string, statsUpdate: Partial<UserStats>): Promise<ApiResponse<void>> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { data: null, error: 'User not found' };
      }

      Object.assign(user.stats, statsUpdate);

      if ('gamesWon' in statsUpdate || 'gamesPlayed' in statsUpdate) {
        user.winRate = user.stats.gamesWon / user.stats.gamesPlayed;
      }

      await user.save();
      UserListCache.updateUser(userId, { stats: user.stats, winRate: user.winRate });
      await userSSEManager.sendUserUpdate(user);

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

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { stats: defaultStats, winRate: 0 } },
        { new: true }
      ).lean();

      if (!user) {
        return { data: null, error: 'User not found' };
      }

      const updatedClientUser: ClientUser = {
        _id: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
        email: user.email,
        rating: user.rating,
        stats: defaultStats,
        title: user.title,
        lastLogin: user.lastLogin,
        isOnline: user.isOnline,
        isGame: user.isGame,
        winRate: 0,
        friends: user.friends,
        chatSetting: user.chatSetting,
      };

      UserListCache.updateUser(userId, updatedClientUser);
      await userSSEManager.sendUserUpdate(updatedClientUser);

      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  static async getUserById(userId: string): Promise<ApiResponse<ClientUser>> {
    try {
      const cachedUser = UserListCache.getUserById(userId);
      if (cachedUser) {
        return { data: cachedUser, error: null };
      }

      const user = await User.findById(userId).lean();
      if (!user) {
        return { data: null, error: 'User not found' };
      }

      const clientUser: ClientUser = {
        _id: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
        email: user.email,
        rating: user.rating,
        stats: user.stats,
        title: user.title,
        lastLogin: user.lastLogin,
        isOnline: user.isOnline,
        isGame: user.isGame,
        winRate: user.winRate,
        friends: user.friends,
        chatSetting: user.chatSetting,
      };

      // UserListCache.addUser(clientUser);
      return { data: clientUser, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }
}

if (import.meta.client) {
  setInterval(() => UserService.syncAllUsersStatus(), 5000);
}
