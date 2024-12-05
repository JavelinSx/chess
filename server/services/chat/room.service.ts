// services/chat/room.service.ts
import type { ApiResponse } from '~/server/types/api';
import type { ChatRoom, CreateRoomParams, RoomWithPrivacy, ChatParticipant } from './types';
import ChatRoomModel from '~/server/db/models/chat-room.model';
import { chatRoomsSSEManager } from '~/server/utils/sseManager/chat/ChatRoomSSEManager';
import { privacyService } from './privacy.service';

export const roomService = {
  async createOrGetRoom(params: CreateRoomParams): Promise<ApiResponse<RoomWithPrivacy>> {
    try {
      // Проверяем существующую комнату
      let room = await ChatRoomModel.findOne({
        'participants.userId': {
          $all: [params.userId, params.recipientId],
        },
      }).lean();

      if (room) {
        const canInteract = await privacyService.canInteract(params.userChatSetting, params.recipientChatSetting);
        // Обновляем настройки участников
        room.participants = room.participants.map((user) => {
          if (String(user.userId) === params.userId) {
            return { ...user, chatSetting: params.userChatSetting };
          }
          if (String(user.userId) === params.recipientId) {
            return { ...user, chatSetting: params.recipientChatSetting };
          }
          return user;
        });
        return {
          data: {
            ...room,
            canSendMessage: canInteract,
            isBlocked: false,
          },
          error: null,
        };
      }

      // Создаем новую комнату
      room = (
        await ChatRoomModel.create({
          participants: [
            {
              userId: params.userId,
              username: params.username,
              chatSetting: params.userChatSetting,
              avatar: params.userAvatar,
            },
            {
              userId: params.recipientId,
              username: params.recipientUsername,
              chatSetting: params.recipientChatSetting,
              avatar: params.recipientAvatar,
            },
          ],
          messages: [],
          messageCount: 0,
          lastMessage: null,
          blockedUsers: [],
          restrictions: [],
          isActive: true,
          lastMessageAt: new Date(),
        })
      ).toObject();

      // Уведомляем участников о создании
      await Promise.all([
        chatRoomsSSEManager.notifyRoomCreated(params.userId, room),
        chatRoomsSSEManager.notifyRoomCreated(params.recipientId, room),
      ]);

      return {
        data: {
          ...room,
          canSendMessage: true,
          isBlocked: false,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create room',
      };
    }
  },

  async getRooms(userId: string): Promise<ApiResponse<ChatRoom[]>> {
    try {
      const rooms = await ChatRoomModel.find({
        'participants.userId': userId,
        isActive: true,
      })
        .select('-messages')
        .sort({ lastMessageAt: -1 })
        .lean<ChatRoom[]>();

      return { data: rooms as ChatRoom[], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get rooms',
      };
    }
  },

  async deleteRoom(roomId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      // Проверяем права на удаление
      const isParticipant = room.participants.some((p) => p.userId === userId);

      if (!isParticipant) {
        return {
          data: null,
          error: 'Not authorized to delete room',
        };
      }

      // Мягкое удаление
      await ChatRoomModel.findByIdAndUpdate(roomId, {
        isActive: false,
      });

      // Уведомляем участников
      for (const participant of room.participants) {
        await chatRoomsSSEManager.notifyRoomDeleted(participant.userId, roomId);
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete room',
      };
    }
  },

  async updateParticipant(
    roomId: string,
    userId: string,
    updates: Partial<ChatParticipant>
  ): Promise<ApiResponse<ChatRoom>> {
    try {
      const room = await ChatRoomModel.findOneAndUpdate(
        {
          _id: roomId,
          'participants.userId': userId,
        },
        {
          $set: {
            'participants.$': {
              ...updates,
              userId,
            },
          },
        },
        { new: true }
      ).lean<ChatRoom>();

      if (!room) {
        return { data: null, error: 'Room or participant not found' };
      }

      // Уведомляем другого участника
      const otherParticipant = room.participants.find((p) => p.userId !== userId);

      if (otherParticipant) {
        await chatRoomsSSEManager.notifyRoomUpdated(otherParticipant.userId, roomId);
      }

      return { data: room as ChatRoom, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update participant',
      };
    }
  },

  async getParticipants(roomId: string): Promise<ApiResponse<ChatParticipant[]>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      return { data: room.participants, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get participants',
      };
    }
  },
};
