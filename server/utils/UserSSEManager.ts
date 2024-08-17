// server/utils/UserSSEManager.ts
import { H3Event } from 'h3';
import type { ClientUser, IUser } from '~/server/types/user';

export interface UserStatus {
  isOnline: boolean;
  isGame: boolean;
}

export class UserSSEManager {
  private userConnections: Map<string, H3Event> = new Map();

  addUserConnection(userId: string, event: H3Event) {
    this.userConnections.set(userId, event);
  }

  removeUserConnection(userId: string) {
    this.userConnections.delete(userId);
  }

  isUserConnected(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  async sendUserStatusUpdate(userId: string, status: UserStatus) {
    const event = this.userConnections.get(userId);
    if (event) {
      await this.sendEvent(
        event,
        JSON.stringify({
          type: 'status_update',
          userId,
          ...status,
        })
      );
    }
  }
  async sendUserUpdate(userId: string, userData: ClientUser) {
    const event = this.userConnections.get(userId);
    if (event) {
      await this.sendEvent(
        event,
        JSON.stringify({
          type: 'user_update',
          user: userData,
        })
      );
    }
  }
  async broadcastUserListUpdate(users: ClientUser[]) {
    const message = JSON.stringify({
      type: 'user_list_update',
      users: users,
    });

    for (const event of this.userConnections.values()) {
      await this.sendEvent(event, message);
    }
  }

  private async sendEvent(event: H3Event, data: string) {
    await event.node.res.write(`data: ${data}\n\n`);
  }
}
