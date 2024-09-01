// server/types/chat.ts

import type { ObjectId } from 'mongoose';

export interface ChatMessage {
  _id: ObjectId;
  sender: ObjectId;
  receiver: ObjectId;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  isEdited: boolean;
}

export interface ChatRoom {
  _id: ObjectId;
  participants: ObjectId[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export interface ClientChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isEdited: boolean;
}

export interface ClientChatRoom {
  id: string;
  participantIds: string[];
  lastMessage: ClientChatMessage | null;
  unreadCount: number;
}
