import type { H3Event } from 'h3';
import type { ChatMessage } from '~/server/services/chat/types';

// server/utils/sseManager/PrivateChatSSEManager.ts
export class PrivateChatSSEManager {
  private roomConnections: Map<string, Map<string, H3Event>> = new Map();

  async addConnection(roomId: string, userId: string, event: H3Event) {
    let roomUsers = this.roomConnections.get(roomId);
    if (!roomUsers) {
      roomUsers = new Map();
      this.roomConnections.set(roomId, roomUsers);
    }
    roomUsers.set(userId, event);
    this.sendEvent(event, JSON.stringify({ type: 'connection_established', userId }));
  }

  async removeConnection(roomId: string, userId: string) {
    const roomUsers = this.roomConnections.get(roomId);
    if (roomUsers) {
      roomUsers.delete(userId);
      if (roomUsers.size === 0) {
        this.roomConnections.delete(roomId);
      }
    }
  }

  async sendMessage(roomId: string, message: ChatMessage) {
    const roomUsers = this.roomConnections.get(roomId);
    if (roomUsers) {
      const event = JSON.stringify({
        type: 'new_message',
        data: { message },
      });

      for (const connection of roomUsers.values()) {
        await this.sendEvent(connection, event);
      }
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
export const privateChatSSEManager = new PrivateChatSSEManager();
