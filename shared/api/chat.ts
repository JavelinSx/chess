// client/api/chat.ts
import type { ChatMessage, ChatRoom, PaginatedMessages, CreateRoomParams } from '~/server/services/chat/types';
import type { ApiResponse } from '~/server/types/api';
import { apiRequest } from './api';

export const chatApi = {
  // Room operations
  async createOrGetRoom({
    userId,
    username,
    chatSetting,
    recipientId,
    recipientUsername,
    recipientChatSetting,
  }: CreateRoomParams): Promise<ApiResponse<ChatRoom>> {
    return apiRequest('/chat/room/create-or-get', 'POST', {
      userId,
      username,
      chatSetting,
      recipientId,
      recipientUsername,
      recipientChatSetting,
    });
  },

  async getRooms(): Promise<ApiResponse<ChatRoom[]>> {
    return apiRequest('/chat/rooms', 'GET');
  },

  // Message operations
  async sendMessage(roomId: string, content: string): Promise<ApiResponse<ChatMessage>> {
    return apiRequest('/chat/message/send', 'POST', { roomId, content });
  },

  async getMessages(roomId: string, page: number = 1, limit: number = 50): Promise<ApiResponse<PaginatedMessages>> {
    return apiRequest(`/chat/room/${roomId}/messages`, 'GET', undefined, {
      page: page.toString(),
      limit: limit.toString(),
    });
  },

  async deleteRoom(roomId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest('/chat/room/delete', 'POST', { roomId });
  },
};
