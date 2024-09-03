import mongoose from 'mongoose';

export interface ChatMessage {
  _id?: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  isEdited: boolean;
}

export interface ChatRoom {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  messages: ChatMessage[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export interface ClientChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isEdited: boolean;
}

export interface ClientChatRoom {
  id: string;
  participantIds: string[];
  messages: ClientChatMessage[];
  lastMessage: ClientChatMessage | null;
  unreadCount: number;
}
