// server/db/models/chatRoom.model.ts

import mongoose from 'mongoose';
import type { ChatRoom, ChatMessage } from '~/server/types/chat';

const chatMessageSchema = new mongoose.Schema<ChatMessage>({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  isEdited: { type: Boolean, default: false },
});

const chatRoomSchema = new mongoose.Schema<ChatRoom>({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [chatMessageSchema],
  lastMessage: chatMessageSchema,
  unreadCount: { type: Number, default: 0 },
});

export default mongoose.model<ChatRoom>('ChatRoom', chatRoomSchema);
