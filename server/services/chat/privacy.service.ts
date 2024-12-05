// services/chat/privacy.service.ts
import ChatRoomModel from '~/server/db/models/chat-room.model';
import User from '~/server/db/models/user.model';
import type { ApiResponse } from '~/server/types/api';
import type { ChatSetting } from '~/server/types/user';
import { chatRoomsSSEManager } from '~/server/utils/sseManager/chat/ChatRoomSSEManager';
import type { ChatRoom } from './types';

export const privacyService = {
  async updatePrivacy(userId: string, newChatSetting: ChatSetting): Promise<ApiResponse<void>> {
    try {
      // Находим все комнаты, где участвует пользователь
      const rooms = await ChatRoomModel.find({
        'participants.userId': userId,
      }).lean<ChatRoom[]>();

      // Обновляем настройки в каждой комнате
      const updatePromises = rooms.map((room) => {
        const updatedParticipants = room.participants.map((participant) => {
          if (participant.userId === userId) {
            return {
              ...participant,
              chatSetting: newChatSetting,
            };
          }
          return participant;
        });

        return ChatRoomModel.findByIdAndUpdate(room._id, { $set: { participants: updatedParticipants } });
      });

      await Promise.all(updatePromises);

      // Уведомляем всех участников чата об изменении настроек
      for (const room of rooms) {
        const otherParticipant = room.participants.find((p) => p.userId !== userId);
        if (otherParticipant) {
          await chatRoomsSSEManager.notifyRoomUpdated(otherParticipant.userId, room._id as string);
        }
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update privacy settings',
      };
    }
  },

  async canInteract(
    userChatSetting: ChatSetting,
    otherUserChatSetting: ChatSetting,
    userId?: string,
    otherUserId?: string
  ): Promise<boolean> {
    // Если у кого-то стоит nobody - общение невозможно
    if (userChatSetting === 'nobody' || otherUserChatSetting === 'nobody') {
      return false;
    }

    // Если у обоих all - общение разрешено
    if (userChatSetting === 'all' && otherUserChatSetting === 'all') {
      return true;
    }

    // Если хотя бы у одного friends_only - проверяем дружбу
    if (userChatSetting === 'friends_only' || otherUserChatSetting === 'friends_only') {
      // Если не переданы ID - считаем что не друзья
      if (!userId || !otherUserId) {
        return false;
      }

      const user = await User.findById(userId);
      if (!user) return false;

      return user.friends.some((friendId) => friendId.toString() === otherUserId);
    }

    return true;
  },

  async checkRoomPrivacy(roomId: string): Promise<ApiResponse<{ isBlocked: boolean }>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      // Проверяем ограничения комнаты
      if (room.restrictions && room.restrictions.length > 0) {
        const activeRestriction = room.restrictions.find((r) => r.restrictedUntil > new Date());
        if (activeRestriction) {
          return { data: { isBlocked: true }, error: null };
        }
      }

      // Проверяем настройки приватности участников
      const [participant1, participant2] = room.participants;
      const canInteract = await this.canInteract(
        participant1.chatSetting,
        participant2.chatSetting,
        participant1.userId,
        participant2.userId
      );

      return {
        data: { isBlocked: !canInteract },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to check privacy',
      };
    }
  },

  async getBlockedUsers(roomId: string): Promise<ApiResponse<string[]>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      // Получаем активные блокировки
      const blockedUserIds = room.blockedUsers
        .filter((block) => !block.blockedUntil || block.blockedUntil > new Date())
        .map((block) => block.userId);

      return { data: blockedUserIds, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get blocked users',
      };
    }
  },

  async applyRestriction(roomId: string, restrictedUntil: Date, reason?: string): Promise<ApiResponse<void>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      room.restrictions.push({
        restrictedUntil,
        reason,
      });

      await room.save();

      // Уведомляем участников
      for (const participant of room.participants) {
        await chatRoomsSSEManager.notifyRoomUpdated(participant.userId, roomId);
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to apply restriction',
      };
    }
  },
};
