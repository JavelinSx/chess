// room.service.ts
import type { ApiResponse } from '~/server/types/api';
import type { ChatRoom, CreateRoomParams } from './types';
import ChatRoomModel from '~/server/db/models/chat-room.model';
import { chatRoomsSSEManager } from '~/server/utils/sseManager/chat/ChatRoomSSEManager';

export const roomService = {
  async createOrGetRoom(params: CreateRoomParams): Promise<ApiResponse<ChatRoom>> {
    try {
      // Явно указываем тип возвращаемых данных
      let room = await ChatRoomModel.findOne({
        'participants.userId': { $all: [params.userId, params.recipientId] },
      }).lean<ChatRoom>();

      if (room) return { data: room, error: null };

      // При создании нового документа
      const newRoom = await ChatRoomModel.create({
        participants: [
          {
            userId: params.userId,
            username: params.username,
            chatSetting: params.chatSetting,
          },
          {
            userId: params.recipientId,
            username: params.recipientUsername,
            chatSetting: params.recipientChatSetting,
          },
        ],
        messages: [],
        lastMessage: null,
        lastMessageAt: new Date(),
        isActive: true,
      });

      // Преобразуем в plain object и указываем тип
      room = newRoom.toObject() as ChatRoom;

      await Promise.all([
        chatRoomsSSEManager.notifyRoomCreated(params.userId, room),
        chatRoomsSSEManager.notifyRoomCreated(params.recipientId, room),
      ]);

      return { data: room, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Create error',
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

      return { data: rooms, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Fetch error' };
    }
  },
  async deleteRoom(roomId: string, userId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      // Находим комнату
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Комната не найдена' };
      }

      // Проверяем, является ли пользователь участником комнаты
      const isParticipant = room.participants.some((p) => String(p.userId) === String(userId));

      if (!isParticipant) {
        return {
          data: null,
          error: 'Нет прав на удаление комнаты',
        };
      }

      // Делаем мягкое удаление - просто помечаем как неактивную
      await ChatRoomModel.deleteOne({ _id: roomId });

      // Уведомляем всех участников об удалении
      for (const participant of room.participants) {
        await chatRoomsSSEManager.notifyRoomDeleted(String(participant.userId), String(roomId));
      }

      return { data: { success: true }, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Ошибка удаления комнаты',
      };
    }
  },
};
