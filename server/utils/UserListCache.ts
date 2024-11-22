import NodeCache from 'node-cache';
import type { ClientUser } from '../types/user';
import User from '../db/models/user.model';
class UserListCache {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache();
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      const users = await User.find({}).lean();

      users.forEach((user) => {
        const clientUser: ClientUser = {
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
        };
        this.cache.set(clientUser._id, clientUser, 3600);
      });

      console.log(`Initialized UserListCache with ${users.length} users`);
    } catch (error) {
      console.error('Error initializing cache:', error);
      throw error;
    }
  }

  updateUser(userId: string, userData: Partial<ClientUser>): void {
    const existingUser = this.cache.get<ClientUser>(userId);
    if (existingUser) {
      // Convert MongoDB ObjectId to string if it exists
      const processedUserData = {
        ...userData,
        _id: userData._id?.toString() || userId,
        friends: Array.isArray(userData.friends)
          ? userData.friends.map((friend) => (typeof friend === 'string' ? friend : String(friend)))
          : existingUser.friends,
      };

      const updatedUser = {
        ...existingUser,
        ...processedUserData,
      };

      this.cache.set(userId, updatedUser, 3600);
    }
  }

  getUserById(userId: string): ClientUser | undefined {
    if (typeof userId !== 'string') {
      console.error('Invalid userId type in getUserById:', typeof userId);
      return undefined;
    }
    return this.cache.get<ClientUser>(userId);
  }

  getAllUsers(): ClientUser[] {
    return this.cache.keys().map((key) => {
      const user = this.cache.get<ClientUser>(key)!;
      return {
        ...user,
        _id: user._id.toString(),
      };
    });
  }

  addUser(userData: ClientUser): void {
    // Если пользователь уже есть, обновляем его данные
    const existingUser = this.cache.get<ClientUser>(userData._id);
    if (existingUser) {
      // Сохраняем некоторые динамические свойства из существующего пользователя
      this.cache.set(
        userData._id,
        {
          ...userData,
          isOnline: existingUser.isOnline,
          isGame: existingUser.isGame,
        },
        3600
      );
    } else {
      // Добавляем нового пользователя
      this.cache.set(userData._id, userData, 3600);
    }
  }

  removeUser(userId: string): void {
    this.cache.del(userId);
  }

  setUserOnline(userId: string): void {
    this.updateUserStatus(userId, true, false);
  }

  setUserOffline(userId: string): void {
    this.updateUserStatus(userId, false, false);
  }

  setUserInGame(userId: string): void {
    this.updateUserStatus(userId, true, true);
  }

  updateUserStatus(userId: string, isOnline: boolean, isGame: boolean): void {
    const user = this.getUserById(userId);
    if (user) {
      this.updateUser(userId, { ...user, isOnline, isGame });
    }
  }

  getOnlineUsers(): ClientUser[] {
    return this.getAllUsers().filter((user) => user.isOnline);
  }

  getUsersInGame(): ClientUser[] {
    return this.getAllUsers().filter((user) => user.isGame);
  }
}

export default new UserListCache();
