import NodeCache from 'node-cache';
import type { ClientUser } from '../types/user';

class UserListCache {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache();
  }

  updateUser(userId: string, userData: Partial<ClientUser>): void {
    const existingUser = this.getUserById(userId);
    if (existingUser) {
      this.cache.set(userId, { ...existingUser, ...userData }, 3600);
    } else {
      this.cache.set(userId, userData as ClientUser, 3600);
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
    this.cache.set(userData._id, userData, 3600);
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
