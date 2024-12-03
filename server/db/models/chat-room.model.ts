// server/db/models/chat-room.model.ts

import mongoose from 'mongoose';
import type { ChatMessage, ChatParticipant, ChatRoom } from '~/server/services/chat/types';

const chatMessageSchema = new mongoose.Schema<ChatMessage>({
  username: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Number, default: Date.now },
});

const chatParticipantSchema = new mongoose.Schema<ChatParticipant>({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  chatSetting: { type: String, enum: ['all', 'friends_only', 'nobody'], required: true },
  avatar: { type: String },
});

const chatRoomSchema = new mongoose.Schema<ChatRoom>(
  {
    participants: [chatParticipantSchema],
    messages: [chatMessageSchema],
    messageCount: { type: Number, default: 0 },
    lastMessage: { type: chatMessageSchema, default: null },
    lastMessageAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Используем стандартные timestamps
  }
);

// Создаем индексы для оптимизации
chatRoomSchema.index({ 'participants.id': 1 });
chatRoomSchema.index({ lastMessageAt: -1 });

const ChatRoomModel = mongoose.model<ChatRoom>('ChatRoom', chatRoomSchema);

export default ChatRoomModel;
