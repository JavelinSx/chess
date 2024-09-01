// server/utils/UserSSEManager.ts
import { H3Event } from 'h3';
import type { ClientUser, IUser } from '~/server/types/user';
import type { Friend, FriendRequest, FriendRequestClient } from '../types/friends';

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
  async sendFriendRequestNotification(userId: string, request: FriendRequest) {
    const event = this.userConnections.get(userId);
    if (event) {
      await this.sendEvent(
        event,
        JSON.stringify({
          type: 'friend_request',
          request,
        })
      );
    }
  }

  async sendFriendRequestUpdateNotification(userId: string, updatedRequest: FriendRequestClient) {
    const event = this.userConnections.get(userId);
    if (event) {
      await this.sendEvent(
        event,
        JSON.stringify({
          type: 'friend_request_update',
          request: updatedRequest,
        })
      );
    }
  }

  async sendFriendListUpdateNotification(userId: string, friends: Friend[]) {
    console.log(`Sending friend list update to user ${userId}:`, friends);
    const event = this.userConnections.get(userId);
    if (event) {
      const message = JSON.stringify({
        type: 'friend_list_update',
        friends: friends.map((friend) => ({
          _id: friend._id.toString(),
          username: friend.username,
          isOnline: friend.isOnline,
          isGame: friend.isGame,
        })),
      });
      console.log(`SSE message being sent:`, message);
      await this.sendEvent(event, message);
      console.log(`SSE message sent successfully`);
    } else {
      console.log(`No active connection found for user ${userId}`);
    }
  }

  async sendFriendRequestsUpdateNotification(userId: string, requests: FriendRequest[]) {
    console.log(`Sending friend requests update to user ${userId}:`, requests);
    const event = this.userConnections.get(userId);
    if (event) {
      const message = JSON.stringify({
        type: 'friend_requests_update',
        requests,
      });
      console.log(`SSE message being sent:`, message);
      await this.sendEvent(event, message);
      console.log(`SSE message sent successfully`);
    } else {
      console.log(`No active connection found for user ${userId}`);
    }
  }

  private async sendEvent(event: H3Event, data: string) {
    await event.node.res.write(`data: ${data}\n\n`);
  }
}
