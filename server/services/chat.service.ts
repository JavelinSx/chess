import ChatRoomModel from '~/server/db/models/chat-room.model';
import type { IChatRoom, ChatMessage, UserChatMessage } from '~/server/types/chat';
import { sseManager } from '~/server/utils/SSEManager';
import mongoose from 'mongoose';

class ChatService {
  async addMessage(roomId: string, user: { _id: string; username: string }, content: string): Promise<ChatMessage> {
    const room = await ChatRoomModel.findById(roomId);
    if (!room) {
      throw new Error('Chat room not found');
    }

    const message: ChatMessage = {
      _id: new mongoose.Types.ObjectId(),
      username: user.username,
      content,
      timestamp: Date.now(),
    };

    room.messages.push(message);
    room.lastMessage = message;
    room.lastMessageAt = new Date();
    room.messageCount = room.messages.length;

    await room.save();

    return message;
  }

  async createOrGetRoom(user1: UserChatMessage, user2: UserChatMessage): Promise<IChatRoom> {
    const participantIds = [new mongoose.Types.ObjectId(user1._id), new mongoose.Types.ObjectId(user2._id)].sort();

    let room = await ChatRoomModel.findOne({
      'participants._id': { $all: participantIds },
    });

    if (!room) {
      room = new ChatRoomModel({
        participants: [
          { _id: participantIds[0], username: user1.username },
          { _id: participantIds[1], username: user2.username },
        ],
        messages: [],
        messageCount: 0,
        lastMessage: null,
      });
      await room.save();
    }

    return room;
  }

  async getRooms(_id: string): Promise<IChatRoom[]> {
    return ChatRoomModel.find({ 'participants._id': new mongoose.Types.ObjectId(_id) })
      .select('_id participants lastMessage messageCount createdAt updatedAt lastMessageAt')
      .sort({ lastMessageAt: -1 })
      .lean();
  }

  async getRoomMessages(
    roomId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: ChatMessage[]; totalCount: number; currentPage: number; totalPages: number }> {
    // Получаем комнату с количеством сообщений
    const room = await ChatRoomModel.findById(roomId).select('messageCount');
    if (!room) {
      throw new Error('Chat room not found');
    }

    const totalCount = room.messageCount; // Общее количество сообщений
    const totalPages = Math.ceil(totalCount / limit); // Всего страниц
    const skip = (page - 1) * limit; // Пропускаем сообщения для пагинации

    // Если сообщений меньше лимита на странице, отдаем все
    if (totalCount <= limit) {
      const allMessages = await ChatRoomModel.findById(roomId).select('messages').lean();

      if (!allMessages) {
        throw new Error('Failed to fetch messages');
      }

      return {
        messages: allMessages.messages.reverse(), // Отдаем сообщения в обратном порядке
        totalCount,
        currentPage: page,
        totalPages: 1,
      };
    }

    // Если сообщений больше лимита, применяем пагинацию
    const messages = await ChatRoomModel.findById(roomId)
      .select('messages')
      .slice('messages', [skip, limit]) // Пропускаем сообщения в зависимости от страницы и лимита
      .lean();

    if (!messages) {
      throw new Error('Failed to fetch messages');
    }

    return {
      messages: messages.messages.reverse(), // Сообщения в обратном порядке
      totalCount,
      currentPage: page,
      totalPages,
    };
  }

  async getRoomByParticipants(_id1: string, _id2: string): Promise<IChatRoom | null> {
    const participantIds = [_id1, _id2].map((id) => new mongoose.Types.ObjectId(id)).sort();
    return ChatRoomModel.findOne({
      'participants._id': { $all: participantIds },
    }).select('_id participants lastMessage messageCount createdAt updatedAt lastMessageAt');
  }
}

export const chatService = new ChatService();
