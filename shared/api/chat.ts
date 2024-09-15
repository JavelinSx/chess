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
    return apiRequest<ChatMessage>('/chat/send-message', 'POST', {
      roomId,
      content,
      _id: user._id,
      username: user.username,
    });
  },

  async getRooms(): Promise<ApiResponse<IChatRoom[]>> {
    return apiRequest<IChatRoom[]>('/chat/rooms', 'GET');
  },

  async getRoomMessages(
    roomId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<{ messages: ChatMessage[]; totalCount: number; currentPage: number; totalPages: number }>> {
    return apiRequest<{ messages: ChatMessage[]; totalCount: number; currentPage: number; totalPages: number }>(
      `/chat/${roomId}/messages?page=${page}&limit=${limit}`,
      'GET'
    );
  },
};
