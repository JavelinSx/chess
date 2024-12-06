// message.service.ts
import type { ApiResponse } from '~/server/types/api';
import type { ChatMessage, PaginatedMessages } from './types';
import ChatRoomModel from '~/server/db/models/chat-room.model';
import { privateChatSSEManager } from '~/server/utils/sseManager/chat/PrivateChatSSEManager';
import { chatRoomsSSEManager } from '~/server/utils/sseManager/chat/ChatRoomSSEManager';

export const messageService = {
  async sendMessage(roomId: string, senderId: string, content: string): Promise<ApiResponse<ChatMessage>> {
    try {
      const message = {
        roomId,
        senderId,
        content,
        timestamp: Date.now(),
        isRead: false,
      };

      // Сначала добавляем сообщение
      const updatedRoom = await ChatRoomModel.findOneAndUpdate(
        { _id: roomId },
        {
          $push: { messages: message },
          $set: {
            lastMessage: message,
            lastMessageAt: new Date(),
          },
        },
        { new: true }
      ).lean();

      if (!updatedRoom) return { data: null, error: 'Room not found' };

      // Затем обновляем счетчик непрочитанных сообщений для получателя
      await ChatRoomModel.updateOne(
        {
          _id: roomId,
          'participants.userId': { $ne: senderId },
        },
        {
          $inc: { 'participants.$.unreadCount': 1 },
        }
      );

      const savedMessage = updatedRoom.messages[updatedRoom.messages.length - 1];

      // Находим получателя
      const recipient = updatedRoom.participants.find((p) => p.userId.toString() !== senderId);

      if (recipient) {
        // Отправляем уведомление о новом сообщении
        await chatRoomsSSEManager.notifyNewMessage(recipient.userId.toString(), senderId, roomId);
      }

      // Отправляем сообщение в приватный канал
      await privateChatSSEManager.sendMessage(roomId, savedMessage);

      // Обновляем информацию о комнате
      await Promise.all([
        chatRoomsSSEManager.notifyRoomUpdated(roomId, updatedRoom.participants[0].userId),
        chatRoomsSSEManager.notifyRoomUpdated(roomId, updatedRoom.participants[1].userId),
      ]);

      return { data: savedMessage, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Send error' };
    }
  },

  async markMessagesAsRead(roomId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      await ChatRoomModel.updateOne(
        { _id: roomId, 'participants.userId': userId },
        {
          $set: {
            'participants.$.unreadCount': 0,
            'messages.$[].isRead': true,
          },
        }
      );

      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to mark messages as read' };
    }
  },

  async getMessages(roomId: string, page = 1, limit = 50): Promise<ApiResponse<PaginatedMessages>> {
    try {
      const room = await ChatRoomModel.getMessagesPaginated(roomId, page, limit);

      if (!room) return { data: null, error: 'Room not found' };

      const sortedMessages = room.messages.sort((a, b) => b.timestamp - a.timestamp);

      return {
        data: {
          messages: sortedMessages,
          totalCount: room.messages.length,
          currentPage: page,
          totalPages: Math.ceil(room.messages.length / limit),
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Fetch error' };
    }
  },
};
