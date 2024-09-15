import ChatRoomModel from '~/server/db/models/chat-room.model';
import User from '../db/models/user.model';
import type { IChatRoom, ChatMessage, UserChatMessage, ChatParticipant } from '~/server/types/chat';
import type { IUser } from '../types/user';
import mongoose from 'mongoose';

class ChatService {
  async addMessage(roomId: string, user: { _id: string; username: string }, content: string): Promise<ChatMessage> {
    // Находим комнату без загрузки сообщений
    const room = await ChatRoomModel.findById(roomId).select('-messages');

    if (!room) {
      throw new Error('Chat room not found');
    }

    const message: ChatMessage = {
      _id: new mongoose.Types.ObjectId(),
      username: user.username,
      content,
      timestamp: Date.now(),
    };

    // Добавляем новое сообщение, не загружая существующие
    await ChatRoomModel.findByIdAndUpdate(roomId, {
      $push: { messages: message },
      $set: {
        lastMessageAt: new Date(),
        lastMessage: message,
      },
      $inc: { messageCount: 1 },
    });

    return message;
  }

  async createOrGetRoom(user1: UserChatMessage, user2: UserChatMessage): Promise<IChatRoom | null> {
    try {
      const [userDoc1, userDoc2] = await Promise.all([
        User.findById(user1._id).select('chatSetting chatRooms'),
        User.findById(user2._id).select('chatSetting chatRooms'),
      ]);

      if (!userDoc1 || !userDoc2) {
        return null;
      }

      // Проверяем, существует ли уже комната между этими пользователями
      const existingRoom = await ChatRoomModel.findOne({
        'participants._id': { $all: [new mongoose.Types.ObjectId(user1._id), new mongoose.Types.ObjectId(user2._id)] },
      });

      if (existingRoom) {
        return existingRoom;
      }

      // Создаем новую комнату
      const newRoom = new ChatRoomModel({
        participants: [
          { _id: new mongoose.Types.ObjectId(user1._id), username: user1.username },
          { _id: new mongoose.Types.ObjectId(user2._id), username: user2.username },
        ],
        messages: [],
        messageCount: 0,
        lastMessage: null,
        lastMessageAt: new Date(),
      });

      await newRoom.save();

      // Добавляем ссылку на новую комнату обоим пользователям
      await User.updateMany({ _id: { $in: [user1._id, user2._id] } }, { $push: { chatRooms: newRoom._id } });

      return newRoom;
    } catch (error) {
      console.error('Error in createOrGetRoom:', error);
      throw error;
    }
  }

  async getRooms(userId: string): Promise<IChatRoom[]> {
    try {
      const user = await User.findById(userId).select('chatRooms');
      if (!user) {
        return [];
      }

      const rooms = await ChatRoomModel.find({
        'participants._id': new mongoose.Types.ObjectId(userId),
      })
        .sort({ lastMessageAt: -1 })
        .lean();
      return rooms;
    } catch (error) {
      console.error('Error in getRooms:', error);
      throw error;
    }
  }

  private canCreateChat(user1: any, user2: any): boolean {
    return user1.chatSetting !== false && user2.chatSetting !== false;
  }

  private checkIfFriends(user1: IUser, user2: IUser): boolean {
    return (
      user1.friends.some((friend) => friend._id.toString() === user2._id.toString()) ||
      user2.friends.some((friend) => friend._id.toString() === user1._id.toString())
    );
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
