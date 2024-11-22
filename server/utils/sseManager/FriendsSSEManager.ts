import { H3Event } from 'h3';
import type { Friend, FriendRequest, FriendRequestClient } from '../../types/friends';

export class FriendsSSEManager {
  private friendConnections: Map<string, H3Event> = new Map();

  async addFriendConnection(userId: string, event: H3Event) {
    if (this.friendConnections.get(userId)) return;
    else {
      this.friendConnections.set(userId, event);
      this.sendEvent(event, JSON.stringify({ type: 'connection_established', userId }));
    }
  }

  async removeFriendConnection(userId: string) {
    this.friendConnections.delete(userId);
  }

  async sendFriendRequestNotification(userId: string, request: FriendRequest) {
    const event = this.friendConnections.get(userId);
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
    const event = this.friendConnections.get(userId);
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
    const event = this.friendConnections.get(userId);
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
      await this.sendEvent(event, message);
    }
  }

  async sendFriendRequestsUpdateNotification(userId: string, requests: FriendRequest[]) {
    const event = this.friendConnections.get(userId);
    if (event) {
      const message = JSON.stringify({
        type: 'friend_requests_update',
        requests,
      });
      await this.sendEvent(event, message);
    }
  }

  private async sendEvent(event: H3Event, data: string) {
    await event.node.res.write(`data: ${data}\n\n`);
  }
}

export const friendsSSEManager = new FriendsSSEManager();
