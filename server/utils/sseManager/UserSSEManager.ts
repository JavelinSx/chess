// server/utils/UserSSEManager.ts
import { H3Event } from 'h3';
import UserListCache from '../UserListCache';
import type { ClientUser, IUser, UserStats } from '~/server/types/user';

export interface UserStatus {
  isOnline: boolean;
  isGame: boolean;
}

export class UserSSEManager {
  private userConnections: Map<string, H3Event> = new Map();

  async addUserConnection(userId: string, event: H3Event) {
    await this.sendEvent(event, JSON.stringify({ type: 'connection_established', userId }));
    if (this.userConnections.get(userId)) return;
    else {
      this.userConnections.set(userId, event);
    }
  }

  async removeUserConnection(userId: string) {
    this.userConnections.delete(userId);
  }

  isUserConnected(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  async broadcastUserListUpdate(users: ClientUser[]): Promise<void> {
    const updatedUsers = users.map((user) => {
      const cachedUser = UserListCache.getUserById(user._id.toString());
      return cachedUser ? { ...user, ...cachedUser, _id: cachedUser._id.toString() } : user;
    });

    const message = JSON.stringify({
      type: 'user_list_update',
      users: updatedUsers,
    });

    for (const [userId, connection] of this.userConnections) {
      await this.sendEvent(connection, message);
    }
  }

  async broadcastUserAdded(user: ClientUser) {
    const message = JSON.stringify({
      type: 'user_added',
      user: user,
    });

    for (const [userId, connection] of this.userConnections) {
      await this.sendEvent(connection, message);
    }
  }

  async broadcastUserRemoved(userId: string) {
    const message = JSON.stringify({
      type: 'user_removed',
      userId: userId,
    });

    for (const [userId, connection] of this.userConnections) {
      await this.sendEvent(connection, message);
    }
  }

  async sendUserUpdate(userData: ClientUser) {
    UserListCache.updateUser(userData._id.toString(), userData);
    const message = JSON.stringify({
      type: 'user_update',
      user: userData,
    });
    for (const [userId, connection] of this.userConnections) {
      await this.sendEvent(connection, message);
    }
  }

  async sendUserListUpdate(userId: string, users: ClientUser[]) {
    const connection = this.userConnections.get(userId);
    if (connection) {
      const message = JSON.stringify({
        type: 'user_list_update',
        users: users,
      });
      await this.sendEvent(connection, message);
    }
  }

  async sendUserStatsUpdate(userId: string, updatedStats: UserStats) {
    const event = this.userConnections.get(userId);
    if (event) {
      await this.sendEvent(
        event,
        JSON.stringify({
          type: 'user_stats_update',
          userId,
          stats: updatedStats,
        })
      );
    }
  }

  async broadcastUserStatusUpdate(userId: string, status: UserStatus) {
    UserListCache.updateUserStatus(userId, status.isOnline, status.isGame);
    const user = UserListCache.getUserById(userId);
    if (user) {
      const message = JSON.stringify({
        type: 'user_status_update',
        userId,
        status,
      });

      // Отправляем обновление всем подключенным пользователям
      const sendPromises = Array.from(this.userConnections.values()).map((connection) =>
        this.sendEvent(connection, message).catch((error) => console.error('Error sending status update:', error))
      );

      await Promise.all(sendPromises);
    }
  }

  async sendActiveUsersList(userId: string, activeUsers: any[]) {
    const connection = this.userConnections.get(userId);
    if (connection) {
      const message = JSON.stringify({
        type: 'active_users_list',
        users: activeUsers,
      });
      await this.sendEvent(connection, message);
    }
  }

  async broadcastUserDeleted(userId: string) {
    const message = JSON.stringify({
      type: 'user_deleted',
      userId,
    });

    for (const [userId, connection] of this.userConnections) {
      await this.sendEvent(connection, message);
    }
  }
  private async sendEvent(event: H3Event, data: string, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        await event.node.res.write(`data: ${data}\n\n`);
        return;
      } catch (error: any) {
        // Указываем тип any для error
        if (error.code === 'EBUSY' && i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  }
}

export const userSSEManager = new UserSSEManager();
