import { apiRequest } from './api';
import type { ClientChatRoom, ClientChatMessage } from '~/server/types/chat';

export const chatApi = {
  async getChatRooms(userId: string) {
    return apiRequest<ClientChatRoom[]>('/chat/rooms', 'GET', { userId });
  },

  async createChatRoom(otherUserId: string) {
    return apiRequest<ClientChatRoom>('/chat/rooms', 'POST', { otherUserId });
  },

  async sendMessage(senderId: string, receiverId: string, content: string) {
    return apiRequest<ClientChatMessage>('/chat/messages', 'POST', { senderId, receiverId, content });
  },

  async getMessages(roomId: string) {
    return apiRequest<ClientChatMessage[]>(`/chat/messages/${roomId}`, 'GET');
  },

  async deleteChat(roomId: string) {
    return apiRequest<void>(`/chat/rooms/${roomId}`, 'DELETE');
  },

  async markAsRead(roomId: string) {
    return apiRequest<void>(`/chat/messages/${roomId}/read`, 'POST');
  },
};
