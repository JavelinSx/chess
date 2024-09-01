// server/utils/ChatSSEManager.ts
import { H3Event } from 'h3';
import type { ClientChatMessage, ClientChatRoom } from '../types/chat';

export class ChatSSEManager {
  private chatConnections: Map<string, H3Event> = new Map();

  addChatConnection(userId: string, event: H3Event) {
    this.chatConnections.set(userId, event);
  }

  removeChatConnection(userId: string) {
    this.chatConnections.delete(userId);
  }

  async sendChatMessage(userId: string, message: ClientChatMessage) {
    const event = this.chatConnections.get(userId);
    if (event) {
      await this.sendEvent(
        event,
        JSON.stringify({
          type: 'chat_message',
          message,
        })
      );
    }
  }

  async sendChatRoomUpdate(userId: string, room: ClientChatRoom) {
    const event = this.chatConnections.get(userId);
    if (event) {
      await this.sendEvent(
        event,
        JSON.stringify({
          type: 'chat_room_update',
          room,
        })
      );
    }
  }

  private async sendEvent(event: H3Event, data: string) {
    await event.node.res.write(`data: ${data}\n\n`);
  }
}
