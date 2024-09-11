import mongoose from 'mongoose';

export interface ChatMessage {
  _id: mongoose.Types.ObjectId;
  username: string;
  content: string;
  timestamp: number;
}

export interface ChatParticipant {
  _id: mongoose.Types.ObjectId;
  username: string;
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
}

export interface UserChatMessage {
  _id: string;
  username: string;
}

export interface UserChatSettings {
  _id: string;
  chatAccessibility: 'friends' | 'all';
}
