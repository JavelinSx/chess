// client/api/chat.ts
import type {
  ChatMessage,
  ChatRoom,
  PaginatedMessages,
  CreateRoomParams,
  RoomWithPrivacy,
  BlockedUser,
  ChatParticipant,
  MessageStatus,
} from '~/server/services/chat/types';
import type { ApiResponse } from '~/server/types/api';
import { apiRequest } from './api';
import type { ChatSetting } from '~/server/types/user';

export const chatApi = {
  // Room operations
  async createOrGetRoom({
    userId,
    username,
    userChatSetting,
    userAvatar,
    recipientId,
    recipientUsername,
    recipientChatSetting,
    recipientAvatar,
  }: CreateRoomParams): Promise<ApiResponse<RoomWithPrivacy>> {
    return apiRequest('/chat/room/create-or-get', 'POST', {
      userId,
      username,
      userChatSetting,
      userAvatar,
      recipientId,
      recipientUsername,
      recipientChatSetting,
      recipientAvatar,
    });
  },

  async getRooms(): Promise<ApiResponse<ChatRoom[]>> {
    return apiRequest('/chat/rooms', 'GET');
  },

  async deleteRoom(roomId: string): Promise<ApiResponse<void>> {
    return apiRequest('/chat/room/delete', 'POST', { roomId });
  },

  async getParticipants(roomId: string): Promise<ApiResponse<ChatParticipant[]>> {
    return apiRequest(`/chat/room/${roomId}/participants`, 'GET');
  },

  async updateParticipant(
    roomId: string,
    userId: string,
    updates: Partial<ChatParticipant>
  ): Promise<ApiResponse<ChatRoom>> {
    return apiRequest('/chat/room/participant/update', 'POST', { roomId, userId, updates });
  },

  // Message operations
  async sendMessage(
    roomId: string,
    senderId: string,
    content: string,
    username: string
  ): Promise<ApiResponse<ChatMessage>> {
    return apiRequest('/chat/message/send', 'POST', { roomId, senderId, content, username });
  },

  async getMessages(roomId: string, page: number = 1, limit: number = 50): Promise<ApiResponse<PaginatedMessages>> {
    return apiRequest(`/chat/room/${roomId}/messages`, 'GET', undefined, {
      page: page.toString(),
      limit: limit.toString(),
    });
  },

  async updateMessageStatus(roomId: string, messageId: string, status: MessageStatus): Promise<ApiResponse<void>> {
    return apiRequest('/chat/message/status', 'POST', { roomId, messageId, status });
  },

  async deleteMessage(roomId: string, messageId: string): Promise<ApiResponse<void>> {
    return apiRequest('/chat/message/delete', 'POST', { roomId, messageId });
  },

  // Privacy operations
  async updatePrivacy(userId: string, chatSetting: ChatSetting): Promise<ApiResponse<void>> {
    return apiRequest('/chat/privacy/update', 'POST', { userId, chatSetting });
  },

  async checkRoomPrivacy(roomId: string): Promise<ApiResponse<{ isBlocked: boolean }>> {
    return apiRequest(`/chat/privacy/${roomId}`, 'GET');
  },

  async applyRestriction(roomId: string, restrictedUntil: Date, reason?: string): Promise<ApiResponse<void>> {
    return apiRequest('/chat/restriction/apply', 'POST', { roomId, restrictedUntil, reason });
  },

  // Block operations
  async blockUser(roomId: string, userId: string, blockedUntil?: Date, reason?: string): Promise<ApiResponse<void>> {
    return apiRequest('/chat/block/add', 'POST', { roomId, userId, blockedUntil, reason });
  },

  async unblockUser(roomId: string, userId: string): Promise<ApiResponse<void>> {
    return apiRequest('/chat/block/remove', 'POST', { roomId, userId });
  },

  async getBlockInfo(roomId: string, userId: string): Promise<ApiResponse<BlockedUser | null>> {
    return apiRequest(`/chat/block/info/${roomId}/${userId}`, 'GET');
  },

  async updateBlockDuration(roomId: string, userId: string, newBlockedUntil: Date): Promise<ApiResponse<void>> {
    return apiRequest('/chat/block/duration', 'POST', { roomId, userId, newBlockedUntil });
  },

  async getBlockedRooms(userId: string): Promise<ApiResponse<ChatRoom[]>> {
    return apiRequest(`/chat/block/rooms/${userId}`, 'GET');
  },

  async cleanExpiredBlocks(roomId: string): Promise<ApiResponse<void>> {
    return apiRequest(`/chat/block/clean/${roomId}`, 'POST');
  },
};
