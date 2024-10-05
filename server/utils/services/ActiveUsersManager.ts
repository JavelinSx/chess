// server/utils/ActiveUsersManager.ts
export class ActiveUsersManager {
  private activeUsers: Map<string, { username: string; isOnline: boolean }> = new Map();

  addUser(userId: string, username: string, isOnline: boolean) {
    this.activeUsers.set(userId, { username, isOnline });
  }

  removeUser(userId: string) {
    this.activeUsers.delete(userId);
  }

  updateUserStatus(userId: string, isOnline: boolean) {
    const user = this.activeUsers.get(userId);
    if (user) {
      user.isOnline = isOnline;
    }
  }

  getActiveUsers() {
    return Array.from(this.activeUsers.entries()).map(([id, user]) => ({
      _id: id,
      username: user.username,
      isOnline: user.isOnline,
    }));
  }
}

export const activeUsersManager = new ActiveUsersManager();
