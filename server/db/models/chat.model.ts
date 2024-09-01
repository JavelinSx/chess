// server/models/chatMessage.model.ts

import mongoose from 'mongoose';
import type { ChatMessage } from '~/server/types/chat';

const chatMessageSchema = new mongoose.Schema<ChatMessage>({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 1000 },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  isEdited: { type: Boolean, default: false },
});

export default mongoose.model<ChatMessage>('ChatMessage', chatMessageSchema);
