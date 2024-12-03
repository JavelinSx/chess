import { H3Event } from 'h3';
import type { IChatRoom } from '~/server/types/chat';
import type { ChatMessage } from '~/server/services/chat/types';

export class ChatSSEManager {
  private chatConnections: Map<string, H3Event> = new Map();

  async addChatConnection(userId: string, event: H3Event) {
    if (this.chatConnections.get(userId)) return;
    else {
      this.chatConnections.set(userId, event);
      this.sendEvent(event, JSON.stringify({ type: 'connection_established', userId }));
    }
  }

  async removeChatConnection(userId: string) {
    this.chatConnections.delete(userId);
  }

  async sendChatMessage(roomId: string, message: ChatMessage) {
    const event = JSON.stringify({
      type: 'new_message',
      data: {
        roomId,
        message,
      },
    });
    for (const [userId, connection] of this.chatConnections) {
      await this.sendEvent(connection, event);
    }
  }

  async sendChatRoomUpdateNotification(userId: string, roomId: string) {
    const event = this.chatConnections.get(userId);
    if (event) {
      await this.sendEvent(
        event,
        JSON.stringify({
          type: 'chat_room_update',
          roomId: roomId,
        })
      );
    }
  }

  async sendChatRoomCreated(userId: string, room: IChatRoom) {
    const event = this.chatConnections.get(userId);
    if (event) {
      await this.sendEvent(
        event,
        JSON.stringify({
          type: 'room_created',
          data: room,
        })
      );
    }
  }

  private async sendEvent(event: H3Event, data: string) {
    await event.node.res.write(`data: ${data}\n\n`);
  }
}

export const chatSSEManager = new ChatSSEManager();
