// shared/api/chat.ts
import { apiRequest } from './api';
import type { ClientChatRoom, ClientChatMessage } from '~/server/types/chat';

export const chatApi = {
  async getChatRooms(userId: string) {
    console.log('Sending request to get chat rooms for user:', userId);
    const response = await apiRequest<ClientChatRoom[]>('/chat/rooms', 'GET', { userId });
    console.log('Response from /chat/rooms:', response);
    return response;
  },

  async createChatRoom(otherUserId: string) {
    return apiRequest<ClientChatRoom>('/chat/rooms', 'POST', { otherUserId });
  },

  async sendMessage(senderId: string, receiverId: string, content: string) {
    return apiRequest<ClientChatMessage>('/chat/messages', 'POST', { senderId, receiverId, content });
  },

  async getMessages(roomId: string) {
    if (!roomId) {
      console.error('Attempted to get messages with undefined roomId');
      return { data: null, error: 'Invalid room ID' };
    }
    console.log('Fetching messages for room:', roomId);
    return apiRequest<ClientChatMessage[]>(`/chat/messages/${roomId}`, 'GET');
  },

  async deleteChat(roomId: string) {
    return apiRequest<void>(`/chat/rooms/${roomId}`, 'DELETE');
  },

  async markAsRead(roomId: string) {
    return apiRequest<void>(`/chat/messages/${roomId}/read`, 'POST');
  },
};
