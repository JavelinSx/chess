// services/chat/message.service.ts
import mongoose from 'mongoose';
import type { ChatMessage, GetMessagesParams, PaginatedMessages } from './types';
import type { ChatSetting } from './types';
import type { ApiResponse } from '~/server/types/api';
import ChatRoom from '~/server/db/models/chat-room.model';
import { privacyService } from './privacy.service';
import { chatSSEManager } from '~/server/utils/sseManager/ChatSSEManager';

export const messageService = {
  async add(
    roomId: string,
    user: { _id: string; username: string; chatSetting: ChatSetting },
    content: string
  ): Promise<ApiResponse<{ message: ChatMessage; success: boolean }>> {
    try {
      const room = await ChatRoom.findById(roomId).populate('participants', 'chatSetting').lean();

      if (!room) {
        return { data: null, error: 'Chat room not found' };
      }

      const otherParticipant = room.participants.find((p) => p.userId !== user._id);
      if (!otherParticipant) {
        return { data: null, error: 'Other participant not found' };
      }

      if (!privacyService.canInteract(user.chatSetting, otherParticipant.chatSetting)) {
        return { data: null, error: 'Cannot send message due to privacy settings' };
      }

      const chatMessage: ChatMessage = {
        _id: new mongoose.Types.ObjectId().toString(),
        username: user.username,
        content,
        timestamp: Date.now(),
      };

      const updatedRoom = await ChatRoom.findByIdAndUpdate(
        roomId,
        {
          $push: { messages: chatMessage },
          $set: {
            lastMessage: chatMessage,
            lastMessageAt: new Date(),
          },
          $inc: { messageCount: 1 },
        },
        { new: true }
      ).lean();

      if (!updatedRoom) {
        return { data: null, error: 'Failed to update chat room' };
      }

      await chatSSEManager.sendChatMessage(roomId, chatMessage);

      return {
        data: {
          success: true,
          message: chatMessage,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  },

  async getMessages(params: GetMessagesParams): Promise<ApiResponse<PaginatedMessages>> {
    const { roomId, page = 1, limit = 50 } = params;

    try {
      const room = await ChatRoom.findById(roomId).populate('participants', 'chatSetting').lean();

      if (!room) {
        return { data: null, error: 'Chat room not found' };
      }

      const totalCount = room.messageCount;
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;

      const messages = room.messages.slice(Math.max(0, totalCount - skip - limit), totalCount - skip).reverse();

      const isBlocked = !privacyService.canInteract(room.participants[0].chatSetting, room.participants[1].chatSetting);

      return {
        data: {
          messages,
          totalCount,
          currentPage: page,
          totalPages,
          isBlocked,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
      };
    }
  },

  async deleteAllMessages(roomId: string): Promise<ApiResponse<void>> {
    try {
      await ChatRoom.findByIdAndUpdate(roomId, {
        $set: {
          messages: [],
          messageCount: 0,
          lastMessage: null,
        },
      });
      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete messages',
      };
    }
  },
};
