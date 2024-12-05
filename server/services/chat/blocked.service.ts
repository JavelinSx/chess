// services/chat/blocked.service.ts

import ChatRoomModel from '~/server/db/models/chat-room.model';
import type { ApiResponse } from '~/server/types/api';
import type { BlockedUser, ChatRoom } from './types';
import { chatRoomsSSEManager } from '~/server/utils/sseManager/chat/ChatRoomSSEManager';

export const blockedService = {
  async blockUser(roomId: string, userId: string, blockedUntil?: Date, reason?: string): Promise<ApiResponse<void>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      const existingBlock = room.blockedUsers.find(
        (block) => block.userId === userId && (!block.blockedUntil || block.blockedUntil > new Date())
      );

      if (existingBlock) {
        return { data: null, error: 'User already blocked' };
      }

      const blockEntry: BlockedUser = {
        userId,
        blockedAt: new Date(),
        blockedUntil,
        reason,
      };

      room.blockedUsers.push(blockEntry);
      await room.save();

      // Уведомляем участников через SSE
      for (const participant of room.participants) {
        await chatRoomsSSEManager.notifyUserBlocked(participant.userId, roomId, blockEntry);
      }

      // Если установлен срок блокировки, создаем таймер для автоматического разблокирования
      if (blockedUntil) {
        const timeUntilExpiry = blockedUntil.getTime() - Date.now();
        if (timeUntilExpiry > 0) {
          setTimeout(async () => {
            await this.unblockUser(roomId, userId);
            // Уведомляем об истечении блокировки
            for (const participant of room.participants) {
              await chatRoomsSSEManager.notifyBlockExpired(participant.userId, roomId);
            }
          }, timeUntilExpiry);
        }
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to block user',
      };
    }
  },

  async unblockUser(roomId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      const blockIndex = room.blockedUsers.findIndex((block) => block.userId === userId);

      if (blockIndex === -1) {
        return { data: null, error: 'User not blocked' };
      }

      room.blockedUsers.splice(blockIndex, 1);
      await room.save();

      // Уведомляем участников через SSE
      for (const participant of room.participants) {
        await chatRoomsSSEManager.notifyUserUnblocked(participant.userId, roomId);
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to unblock user',
      };
    }
  },

  async updateBlockDuration(roomId: string, userId: string, newBlockedUntil: Date): Promise<ApiResponse<void>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      const blockIndex = room.blockedUsers.findIndex((block) => block.userId === userId);

      if (blockIndex === -1) {
        return { data: null, error: 'User not blocked' };
      }

      room.blockedUsers[blockIndex].blockedUntil = newBlockedUntil;
      await room.save();

      // Уведомляем участников через SSE
      for (const participant of room.participants) {
        await chatRoomsSSEManager.notifyBlockDurationUpdated(participant.userId, roomId, room.blockedUsers[blockIndex]);
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update block duration',
      };
    }
  },

  async getBlockInfo(roomId: string, userId: string): Promise<ApiResponse<BlockedUser | null>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      const blockInfo = room.blockedUsers.find(
        (block) => block.userId === userId && (!block.blockedUntil || block.blockedUntil > new Date())
      );

      return { data: blockInfo || null, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get block info',
      };
    }
  },

  async cleanExpiredBlocks(roomId: string): Promise<ApiResponse<void>> {
    try {
      const room = await ChatRoomModel.findById(roomId);

      if (!room) {
        return { data: null, error: 'Room not found' };
      }

      // Фильтруем истекшие блокировки
      const now = new Date();
      room.blockedUsers = room.blockedUsers.filter((block) => !block.blockedUntil || block.blockedUntil > now);

      await room.save();

      // Уведомляем участников
      for (const participant of room.participants) {
        await chatRoomsSSEManager.notifyRoomUpdated(participant.userId, roomId);
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to clean blocks',
      };
    }
  },

  async getBlockedRooms(userId: string): Promise<ApiResponse<ChatRoom[]>> {
    try {
      // Находим комнаты где пользователь заблокирован
      const rooms = await ChatRoomModel.find({
        'blockedUsers.userId': userId,
        'blockedUsers.blockedUntil': {
          $gt: new Date(),
        },
      }).lean<ChatRoom[]>();

      return { data: rooms as ChatRoom[], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get blocked rooms',
      };
    }
  },
};
