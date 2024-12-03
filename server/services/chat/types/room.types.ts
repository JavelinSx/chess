import type { ChatMessage } from './message.types';
import type { ChatParticipant } from './participant.types';

export type ChatSetting = 'all' | 'friends_only' | 'nobody';

export interface ChatRoom {
  _id: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  messageCount: number;
  lastMessage: ChatMessage | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}
