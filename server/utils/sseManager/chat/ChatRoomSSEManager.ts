import type { H3Event } from 'h3';
import type { BlockedUser, ChatRoom } from '~/server/services/chat/types';

// server/utils/sseManager/ChatRoomsSSEManager.ts
export class ChatRoomsSSEManager {
  private connections: Map<string, H3Event> = new Map();

  async addConnection(userId: string, event: H3Event) {
    this.connections.set(userId, event);
    this.sendEvent(event, JSON.stringify({ type: 'connection_established', userId }));
  }

  async removeConnection(userId: string) {
    this.connections.delete(userId);
  }

  async notifyUserBlocked(userId: string, roomId: string, blockInfo: BlockedUser) {
    const connection = this.connections.get(userId);
    if (connection) {
      const event = JSON.stringify({
        type: 'user_blocked',
        data: {
          roomId,
          blockInfo,
        },
      });
      await this.sendEvent(connection, event);
    }
  }

  async notifyUserUnblocked(userId: string, roomId: string) {
    const connection = this.connections.get(userId);
    if (connection) {
      const event = JSON.stringify({
        type: 'user_unblocked',
        data: {
          roomId,
        },
      });
      await this.sendEvent(connection, event);
    }
  }

  async notifyBlockDurationUpdated(userId: string, roomId: string, blockInfo: BlockedUser) {
    const connection = this.connections.get(userId);
    if (connection) {
      const event = JSON.stringify({
        type: 'block_duration_updated',
        data: {
          roomId,
          blockInfo,
        },
      });
      await this.sendEvent(connection, event);
    }
  }

  async notifyBlockExpired(userId: string, roomId: string) {
    const connection = this.connections.get(userId);
    if (connection) {
      const event = JSON.stringify({
        type: 'block_expired',
        data: {
          roomId,
        },
      });
      await this.sendEvent(connection, event);
    }
  }

  async notifyRoomCreated(userId: string, room: ChatRoom) {
    const connection = this.connections.get(userId);
    if (connection) {
      const event = JSON.stringify({
        type: 'room_created',
        data: { room },
      });
      await this.sendEvent(connection, event);
    }
  }

  async notifyRoomDeleted(userId: string, roomId: string) {
    const connection = this.connections.get(userId);
    if (connection) {
      const event = JSON.stringify({
        type: 'room_deleted',
        data: { roomId },
      });
      await this.sendEvent(connection, event);
    }
  }

  async notifyRoomUpdated(userId: string, roomId: string) {
    const connection = this.connections.get(userId);
    if (connection) {
      const event = JSON.stringify({
        type: 'chat_room_update',
        data: { roomId },
      });
      await this.sendEvent(connection, event);
    }
  }

  async notifyPrivacyUpdated(userId: string, chatSetting: string) {
    const connection = this.connections.get(userId);
    if (connection) {
      const event = JSON.stringify({
        type: 'privacy_updated',
        data: {
          userId,
          chatSetting,
        },
      });
      await this.sendEvent(connection, event);
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
export const chatRoomsSSEManager = new ChatRoomsSSEManager();
