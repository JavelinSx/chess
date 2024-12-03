// services/chat/privacy.service.ts
import type { ChatSetting } from './types';
import type { ApiResponse } from '~/server/types/api';
import ChatRoom from '~/server/db/models/chat-room.model';
import { chatSSEManager } from '~/server/utils/sseManager/ChatSSEManager';

export const privacyService = {
  canInteract(userChatSetting: ChatSetting, otherChatSetting: ChatSetting): boolean {
    // Если у одного из пользователей стоит nobody - общение невозможно
    if (userChatSetting === 'nobody' || otherChatSetting === 'nobody') {
      return false;
    }

    // Если у обоих стоит all - общение разрешено
    if (userChatSetting === 'all' && otherChatSetting === 'all') {
      return true;
    }

    // Если хотя бы у одного friends_only - требуется проверка на дружбу
    // В данном случае возвращаем true, так как проверка дружбы будет
    // осуществляться на уровне выше
    if (userChatSetting === 'friends_only' || otherChatSetting === 'friends_only') {
      return true;
    }

    return true;
  },

  async updateUserChatPrivacy(userId: string, newChatSetting: ChatSetting): Promise<ApiResponse<void>> {
    try {
      // Находим все комнаты, где участвует пользователь
      const rooms = await ChatRoom.find({ 'participants.userId': userId }).lean();

      // Обновляем настройки в каждой комнате
      const updatePromises = rooms.map((room) => {
        const updatedParticipants = room.participants.map((participant) => {
          if (participant.userId === userId) {
            return { ...participant, chatSetting: newChatSetting };
          }
          return participant;
        });

        return ChatRoom.findByIdAndUpdate(room._id, { $set: { participants: updatedParticipants } });
      });

      await Promise.all(updatePromises);

      // Оповещаем всех участников чата об изменении настроек
      for (const room of rooms) {
        const otherParticipant = room.participants.find((p) => p.userId !== userId);
        if (otherParticipant) {
          await chatSSEManager.sendChatRoomUpdateNotification(otherParticipant.userId, room._id);
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

  async checkParticipantsPrivacy(roomId: string): Promise<ApiResponse<{ isBlocked: boolean }>> {
    try {
      const room = await ChatRoom.findById(roomId).lean();

      if (!room) {
        return { data: null, error: 'Chat room not found' };
      }

      const [participant1, participant2] = room.participants;
      const isBlocked = !this.canInteract(participant1.chatSetting, participant2.chatSetting);

      return {
        data: { isBlocked },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to check privacy settings',
      };
    }
  },
};
