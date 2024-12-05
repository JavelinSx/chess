// models/chat-room.model.ts
import mongoose from 'mongoose';
import type { BlockedUser, ChatMessage, ChatParticipant, ChatRestriction } from '~/server/services/chat/types';

interface ChatRoomDocument extends mongoose.Document {
  participants: ChatParticipant[];
  messages: ChatMessage[];
  messageCount: number;
  lastMessage: ChatMessage | null;
  blockedUsers: BlockedUser[];
  restrictions: ChatRestriction[];
  isActive: boolean;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },
  deliveredAt: Date,
  readAt: Date,
});

const blockedUserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  blockedAt: { type: Date, default: Date.now },
  blockedUntil: Date,
  reason: String,
});

const chatRestrictionSchema = new mongoose.Schema({
  restrictedUntil: { type: Date, required: true },
  reason: String,
});

const chatMessageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Number, default: Date.now, required: true },
  status: { type: messageStatusSchema, required: true },
});

const chatParticipantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  chatSetting: {
    type: String,
    enum: ['all', 'friends_only', 'nobody'],
    default: 'all',
    required: true,
  },
  avatar: { type: String },
});

const chatRoomSchema = new mongoose.Schema(
  {
    participants: { type: [chatParticipantSchema], required: true },
    messages: { type: [chatMessageSchema], default: [] },
    messageCount: { type: Number, default: 0 },
    lastMessage: { type: chatMessageSchema, default: null },
    blockedUsers: { type: [blockedUserSchema], default: [] },
    restrictions: { type: [chatRestrictionSchema], default: [] },
    isActive: { type: Boolean, default: true },
    lastMessageAt: { type: Date, default: Date.now },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

chatRoomSchema.index({ 'participants.userId': 1 });
chatRoomSchema.index({ lastMessageAt: -1 });
chatRoomSchema.index({ 'messages.timestamp': -1 });
chatRoomSchema.index({ 'blockedUsers.userId': 1 });
chatRoomSchema.index({ 'participants.chatSetting': 1 });

const ChatRoomModel = mongoose.model<ChatRoomDocument>('ChatRoom', chatRoomSchema);

export default ChatRoomModel;
