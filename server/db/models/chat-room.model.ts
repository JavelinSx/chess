import mongoose from 'mongoose';
import type { IChatRoom, ChatMessage, ChatParticipant } from '~/server/types/chat';

const chatParticipantSchema = new mongoose.Schema<ChatParticipant>({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  chatSetting: { type: String, enum: ['all', 'friends_only', 'nobody'], required: true },
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
    messageCount: { type: Number, default: 0 },
    lastMessage: { type: chatMessageSchema, default: null },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatRoomSchema.index({ 'participants._id': 1 });
chatRoomSchema.index({ lastMessageAt: -1 });

const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema);

export default ChatRoom;
