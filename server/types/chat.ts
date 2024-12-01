import mongoose from 'mongoose';
import type { ChatSetting } from './user';

export interface ChatMessage {
  _id: mongoose.Types.ObjectId;
  username: string;
  content: string;
  timestamp: number;
}

export interface ChatParticipant {
  _id: mongoose.Types.ObjectId;
  username: string;
  avatar: string;
  chatSetting: ChatSetting;
}

export interface IChatRoom extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
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

export interface UserChatMessage {
  _id: string;
  username: string;
}
