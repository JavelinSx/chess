import type { ChatMessage } from './types';
import type { ChatSetting } from './types';

export interface ChatParticipant {
  _id: string;
  username: string;
  avatar: string;
  chatSetting: ChatSetting;
}

export interface IChatRoom {
  _id: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  messageCount: number;
  lastMessage: ChatMessage | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  canSendMessage?: boolean;
  isBlocked?: boolean;
}

export interface ChatRoomWithPrivacy extends IChatRoom {
  canSendMessage: boolean;
  isBlocked: boolean;
}
