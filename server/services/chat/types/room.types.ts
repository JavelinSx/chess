import type { ChatMessage } from './message.types';

export interface ChatParticipant {
  userId: string;
  username: string;
  chatSetting: 'all' | 'friends_only' | 'nobody';
  unreadCount: number;
}

export interface ChatRoom {
  _id: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  lastMessage: ChatMessage | null;
  lastMessageAt: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateRoomParams {
  userId: string;
  username: string;
  chatSetting: 'all' | 'friends_only' | 'nobody';
  recipientId: string;
  recipientUsername: string;
  recipientChatSetting: 'all' | 'friends_only' | 'nobody';
}

export interface PaginatedMessages {
  messages: ChatMessage[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
