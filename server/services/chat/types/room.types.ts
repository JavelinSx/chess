import type { ChatMessage } from './message.types';
import type { ChatParticipant } from './participant.types';

// types/chat/rooms.types.ts
export interface BlockedUser {
  userId: string;
  blockedAt: Date;
  blockedUntil?: Date; // для временной блокировки
  reason?: string;
}

export interface ChatRestriction {
  restrictedUntil: Date;
  reason?: string;
}

export interface ChatRoom {
  _id: string | unknown;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  messageCount: number;
  lastMessage: ChatMessage | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  blockedUsers: BlockedUser[];
  restrictions: ChatRestriction[];
  isActive: boolean;
}
