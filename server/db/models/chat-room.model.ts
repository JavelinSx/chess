import mongoose from 'mongoose';
import type { ChatMessage, ChatParticipant, ChatRoom, PaginatedMessages } from '~/server/services/chat/types';

interface ChatRoomDocument extends mongoose.Document {
  participants: ChatParticipant[];
  messages: ChatMessage[];
  lastMessage: ChatMessage | null;
  lastMessageAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Number, default: Date.now, required: true },
  isRead: { type: Boolean, default: false },
});

const participantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  chatSetting: {
    type: String,
    enum: ['all', 'friends_only', 'nobody'],
    default: 'all',
  },
});

const chatRoomSchema = new mongoose.Schema(
  {
    participants: { type: [participantSchema], required: true },
    messages: { type: [messageSchema], default: [] },
    lastMessage: { type: messageSchema, default: null },
    lastMessageAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

chatRoomSchema.statics.getMessagesPaginated = async function (
  roomId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedMessages | null> {
  const [result] = await this.aggregate([
    // Находим нужную комнату
    {
      $match: {
        _id: new mongoose.Types.ObjectId(roomId),
      },
    },

    // Разворачиваем массив сообщений
    {
      $unwind: '$messages',
    },

    // Сортируем сообщения по timestamp по убыванию
    {
      $sort: {
        'messages.timestamp': -1,
      },
    },

    // Группируем для получения общего количества
    {
      $group: {
        _id: null,
        messages: { $push: '$messages' },
        totalCount: { $sum: 1 },
      },
    },

    // Добавляем пагинацию
    {
      $project: {
        messages: {
          $slice: ['$messages', (page - 1) * limit, limit],
        },
        totalCount: 1,
        currentPage: { $literal: page },
        totalPages: {
          $ceil: {
            $divide: ['$totalCount', limit],
          },
        },
      },
    },
  ]);

  return result || null;
};

chatRoomSchema.index({ 'participants.userId': 1 });
chatRoomSchema.index({ lastMessageAt: -1 });
chatRoomSchema.index({ 'messages.timestamp': -1 });

// Добавляем тип для статических методов
interface ChatRoomModel extends mongoose.Model<ChatRoom> {
  getMessagesPaginated(roomId: string, page?: number, limit?: number): Promise<PaginatedMessages | null>;
}

const ChatRoomModel = mongoose.model<ChatRoom, ChatRoomModel>('ChatRoom', chatRoomSchema);

export default ChatRoomModel;
