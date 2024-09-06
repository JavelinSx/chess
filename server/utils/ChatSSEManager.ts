import { H3Event } from 'h3';
import type { ChatMessage, IChatRoom } from '~/server/types/chat';

export class ChatSSEManager {
  private chatConnections: Map<string, H3Event> = new Map();

  addChatConnection(userId: string, event: H3Event) {
    console.log(`Adding chat connection for user ${userId}`);
    this.chatConnections.set(userId, event);
    this.sendEvent(event, JSON.stringify({ type: 'connection_established', userId }));
  }

  removeChatConnection(userId: string) {
    this.chatConnections.delete(userId);
  }

  async sendChatMessage(roomId: string, message: ChatMessage) {
    console.log(`Sending chat message for room ${roomId}:`, message);
    const event = JSON.stringify({
      type: 'new_message',
      data: {
        roomId,
        message,
      },
    });
    console.log(this.chatConnections);
    for (const [userId, connection] of this.chatConnections.entries()) {
      await this.sendEvent(connection, event);
    }
  }

  async sendChatRoomCreated(userId: string, room: IChatRoom) {
    console.log(`Sending chat room created for user ${userId}:`, room);
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
