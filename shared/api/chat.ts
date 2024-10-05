import { apiRequest } from './api';
import { useUserStore } from '~/store/user';
import type { IChatRoom, ChatMessage, UserChatMessage } from '~/server/types/chat';
import type { ChatSetting } from '~/server/types/user';
import type { ApiResponse } from '~/server/types/api';

export interface RoomRequestParams {
  senderUserId: string;
  recipientUserId: string;
  chatSettingSender: string;
  chatSettingRecipient: string;
}

export const chatApi = {
  async createOrGetRoom(params: RoomRequestParams): Promise<ApiResponse<{ room: IChatRoom; canInteract: boolean }>> {
    // Преобразуем params в Record<string, unknown>
    const requestBody: Record<string, unknown> = {
      senderUserId: params.senderUserId,
      recipientUserId: params.recipientUserId,
      chatSettingSender: params.chatSettingSender,
      chatSettingRecipient: params.chatSettingRecipient,
    };

    return apiRequest<{ room: IChatRoom; canInteract: boolean }>('/chat/create-or-get-room', 'POST', requestBody);
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
        chatSetting: user.chatSetting, // Добавьте это поле
      });

      if (response.error && response.error.includes('privacy settings')) {
        throw new Error('Cannot send message due to privacy settings');
      }
      return response;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      if (error instanceof Error) {
        return { data: null, error: error.message };
      }
      return { data: null, error: 'An unknown error occurred' };
    }
  },

  async getRooms(userId: string, chatSetting: ChatSetting): Promise<ApiResponse<IChatRoom[]>> {
    return apiRequest<IChatRoom[]>('/chat/rooms', 'GET', undefined, { userId, chatSetting });
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
