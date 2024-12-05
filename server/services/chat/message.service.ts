// services/chat/message.service.ts

import type { ApiResponse } from '~/server/types/api';
import { MessageStatus, type ChatMessage, type PaginatedMessages } from '~/server/services/chat/types';
import ChatRoomModel from '~/server/db/models/chat-room.model';
import { privateChatSSEManager } from '~/server/utils/sseManager/chat/PrivateChatSSEManager';
import { chatRoomsSSEManager } from '~/server/utils/sseManager/chat/ChatRoomSSEManager';

export const messageService = {
  async sendMessage(
    roomId: string,
    senderId: string,
    content: string,
    username: string
  ): Promise<ApiResponse<ChatMessage>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      const message: ChatMessage = {
        roomId,
        senderId,
        username,
        content,
        timestamp: Date.now(),
        status: {
          status: MessageStatus.SENT,
        },
      };

      // Добавляем сообщение в комнату
      room.messages.push(message);
      room.messageCount++;
      room.lastMessage = message;
      room.lastMessageAt = new Date();

      await room.save();

      // Уведомляем участников приватного чата
      await privateChatSSEManager.sendMessage(roomId, message);

      // Уведомляем об обновлении комнаты
      for (const participant of room.participants) {
        await chatRoomsSSEManager.notifyRoomUpdated(participant.userId, roomId);
      }

      return { data: message, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  },

  async getMessages(roomId: string, page: number = 1, limit: number = 50): Promise<ApiResponse<PaginatedMessages>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      const skip = (page - 1) * limit;
      const messages = room.messages
        .slice(Math.max(0, room.messageCount - skip - limit), room.messageCount - skip)
        .reverse();

      return {
        data: {
          messages,
          totalCount: room.messageCount,
          currentPage: page,
          totalPages: Math.ceil(room.messageCount / limit),
          isBlocked: false, // Будет определяться в privacy service
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get messages',
      };
    }
  },

  async updateStatus(roomId: string, messageId: string, status: MessageStatus): Promise<ApiResponse<void>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      await ChatRoomModel.updateOne(
        {
          _id: roomId,
          'messages._id': messageId,
        },
        {
          $set: {
            'messages.$.status.status': status,
            'messages.$.status.deliveredAt': status === MessageStatus.DELIVERED ? new Date() : undefined,
            'messages.$.status.readAt': status === MessageStatus.READ ? new Date() : undefined,
          },
        }
      );

      // Уведомляем участников об обновлении статуса
      for (const participant of room.participants) {
        await chatRoomsSSEManager.notifyRoomUpdated(participant.userId, roomId);
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update message status',
      };
    }
  },

  async deleteMessage(roomId: string, messageId: string): Promise<ApiResponse<void>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      await ChatRoomModel.updateOne({ _id: roomId }, { $pull: { messages: { _id: messageId } } });

      // Уведомляем участников об удалении
      for (const participant of room.participants) {
        await chatRoomsSSEManager.notifyRoomUpdated(participant.userId, roomId);
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete message',
      };
    }
  },
};
