// server/models/chatRoom.model.ts

import mongoose from 'mongoose';
import type { ChatRoom } from '~/server/types/chat';

const chatRoomSchema = new mongoose.Schema<ChatRoom>({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },
  unreadCount: { type: Number, default: 0 },
});

export default mongoose.model<ChatRoom>('ChatRoom', chatRoomSchema);
