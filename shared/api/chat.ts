import { apiRequest } from './api';
import { useUserStore } from '~/store/user';
import type { IChatRoom, ChatMessage, UserChatMessage } from '~/server/types/chat';
import type { ApiResponse } from '~/server/types/auth';

export const chatApi = {
  async createOrGetRoom(
    currentUser: UserChatMessage,
    otherUser: UserChatMessage
  ): Promise<ApiResponse<{ room: IChatRoom }>> {
    return apiRequest<{ room: IChatRoom }>('/chat/create-or-get-room', 'POST', {
      currentUser: {
        _id: currentUser._id,
        username: currentUser.username,
      },
      otherUser: {
        _id: otherUser._id,
        username: otherUser.username,
      },
    });
  },

  async sendMessage(roomId: string, content: string): Promise<ApiResponse<ChatMessage>> {
    const userStore = useUserStore();
    const user = userStore.user;
    if (!user) {
      throw new Error('User not authenticated');
    }
    try {
      const response = await apiRequest<ChatMessage>('/chat/send-message', 'POST', {
        roomId,
        content,
        _id: user._id,
        username: user.username,
      });

      if (response.error && response.error.includes('privacy settings')) {
        throw new Error('Cannot send message due to privacy settings');
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        return { data: null, error: error.message };
      }
      return { data: null, error: 'An unknown error occurred' };
    }
  },

  async getRooms(): Promise<ApiResponse<IChatRoom[]>> {
    return apiRequest<IChatRoom[]>('/chat/rooms', 'GET');
  },

  async getRoomMessages(
    roomId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<
    ApiResponse<{
      messages: ChatMessage[];
      totalCount: number;
      currentPage: number;
      totalPages: number;
      isBlocked: boolean;
    }>
  > {
    return apiRequest<{
      messages: ChatMessage[];
      totalCount: number;
      currentPage: number;
      totalPages: number;
      isBlocked: boolean;
    }>(`/chat/${roomId}/messages?page=${page}&limit=${limit}`, 'GET');
  },

  async deleteRoom(roomId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>('/chat/delete-room', 'POST', { roomId });
  },
};
