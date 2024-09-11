import mongoose from 'mongoose';
import type { IChatRoom, ChatMessage, ChatParticipant } from '~/server/types/chat';

const chatParticipantSchema = new mongoose.Schema<ChatParticipant>({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  username: { type: String, required: true },
});

const chatMessageSchema = new mongoose.Schema<ChatMessage>({
  _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  username: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Number, default: Date.now },
});

const chatRoomSchema = new mongoose.Schema<IChatRoom>(
  {
    participants: [chatParticipantSchema],
    messages: [chatMessageSchema],
    lastMessageAt: { type: Date, default: Date.now },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ChatRoomModel = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema);

export default ChatRoomModel;
