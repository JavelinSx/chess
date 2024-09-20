import ChatRoomModel from '~/server/db/models/chat-room.model';
import User from '../db/models/user.model';
import type { IChatRoom, ChatMessage, UserChatMessage, ChatParticipant } from '~/server/types/chat';
import type { IUser } from '../types/user';
import mongoose from 'mongoose';

class ChatService {
  async addMessage(roomId: string, user: { _id: string; username: string }, content: string): Promise<ChatMessage> {
    const room = await ChatRoomModel.findById(roomId).select('-messages');

    if (!room) {
      throw new Error('Chat room not found');
    }

    // Проверяем настройки приватности получателя
    const otherParticipant = room.participants.find((p) => p._id.toString() !== user._id);
    if (otherParticipant) {
      const receiver = await User.findById(otherParticipant._id).select('chatSetting friends');
      if (receiver) {
        const canSendMessage =
          receiver.chatSetting || receiver.friends.some((friendId) => friendId.toString() === user._id);
        if (!canSendMessage) {
          throw new Error("Cannot send message due to receiver's privacy settings");
        }
      }
    }

    const message: ChatMessage = {
      _id: new mongoose.Types.ObjectId(),
      username: user.username,
      content,
      timestamp: Date.now(),
    };

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
        User.findById(user1._id).select('chatSetting chatRooms friends'),
        User.findById(user2._id).select('chatSetting chatRooms friends'),
      ]);

      if (!userDoc1 || !userDoc2) {
        return null;
      }

      // Проверяем настройки приватности обоих пользователей
      if (!userDoc1.chatSetting && !userDoc1.friends.some((friendId) => friendId.toString() === user2._id)) {
        throw new Error("Cannot create chat room due to user1's privacy settings");
      }
      if (!userDoc2.chatSetting && !userDoc2.friends.some((friendId) => friendId.toString() === user1._id)) {
        throw new Error("Cannot create chat room due to user2's privacy settings");
      }

      const existingRoom = await ChatRoomModel.findOne({
        'participants._id': { $all: [new mongoose.Types.ObjectId(user1._id), new mongoose.Types.ObjectId(user2._id)] },
      });

      if (existingRoom) {
        return existingRoom;
      }

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

      await User.updateMany({ _id: { $in: [user1._id, user2._id] } }, { $push: { chatRooms: newRoom._id } });

      return newRoom;
    } catch (error) {
      console.error('Error in createOrGetRoom:', error);
      throw error;
    }
  }

  async getRooms(userId: string): Promise<IChatRoom[]> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const user = await User.findById(userId).select('chatSetting friends').lean();

      if (!user) {
        throw new Error('User not found');
      }

      const rooms = await ChatRoomModel.aggregate([
        { $match: { 'participants._id': userObjectId } },
        { $sort: { lastMessageAt: -1 } },
        {
          $lookup: {
            from: 'users',
            let: {
              otherParticipantId: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$participants._id',
                      cond: { $ne: ['$$this', userObjectId] },
                    },
                  },
                  0,
                ],
              },
            },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$otherParticipantId'] } } },
              { $project: { chatSetting: 1, _id: 0 } },
            ],
            as: 'otherParticipant',
          },
        },
        {
          $addFields: {
            otherParticipant: { $arrayElemAt: ['$otherParticipant', 0] },
            isBlocked: {
              $and: [
                { $ne: ['$otherParticipant.chatSetting', true] },
                { $ne: [user.chatSetting, true] },
                { $not: { $in: ['$otherParticipant._id', user.friends] } },
              ],
            },
          },
        },
        { $project: { otherParticipant: 0 } },
      ]);

      return rooms;
    } catch (error) {
      console.error('Error in getRooms:', error);
      throw error;
    }
  }

  async isRoomBlocked(roomId: string, userId: string): Promise<boolean> {
    const room = await ChatRoomModel.findById(roomId).lean();
    if (!room) {
      throw new Error('Room not found');
    }

    const [user, otherUser] = await Promise.all([
      User.findById(userId).select('chatSetting friends').lean(),
      User.findOne({ _id: { $in: room.participants.map((p) => p._id), $ne: userId } })
        .select('chatSetting')
        .lean(),
    ]);

    if (!user || !otherUser) {
      throw new Error('User not found');
    }

    // Чат разблокирован, если оба пользователя имеют открытые настройки или являются друзьями
    return (
      !(user.chatSetting && otherUser.chatSetting) &&
      !user.friends.some((friendId) => friendId.toString() === otherUser._id.toString())
    );
  }

  async getRoomMessages(
    roomId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: ChatMessage[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    isBlocked: boolean;
  }> {
    if (!roomId || !userId) {
      throw new Error('Invalid roomId or userId');
    }

    try {
      const room = await ChatRoomModel.findById(roomId).select('messageCount participants').lean();
      if (!room) {
        throw new Error('Chat room not found');
      }

      const totalCount = room.messageCount;
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;

      const messagesResult = await ChatRoomModel.findById(roomId)
        .select('messages')
        .slice('messages', totalCount <= limit ? -totalCount : [skip, limit])
        .lean();

      if (!messagesResult) {
        throw new Error('Failed to fetch messages');
      }

      const isBlocked = await this.isRoomBlocked(roomId, userId);

      return {
        messages: messagesResult.messages.reverse(),
        totalCount,
        currentPage: page,
        totalPages,
        isBlocked,
      };
    } catch (error) {
      console.error('Error in getRoomMessages:', error);
      throw error;
    }
  }

  async getRoomByParticipants(_id1: string, _id2: string): Promise<IChatRoom | null> {
    const participantIds = [_id1, _id2].map((id) => new mongoose.Types.ObjectId(id)).sort();
    return ChatRoomModel.findOne({
      'participants._id': { $all: participantIds },
    }).select('_id participants lastMessage messageCount createdAt updatedAt lastMessageAt');
  }

  async deleteRoom(roomId: string, userId: string): Promise<void> {
    const room = await ChatRoomModel.findById(roomId);
    if (!room) {
      throw new Error('Chat room not found');
    }

    if (!room.participants.some((p) => p._id.toString() === userId)) {
      throw new Error('User is not a participant of this room');
    }

    // Удаляем комнату
    await ChatRoomModel.findByIdAndDelete(roomId);

    // Удаляем ссылку на комнату у обоих участников
    await User.updateMany({ _id: { $in: room.participants.map((p) => p._id) } }, { $pull: { chatRooms: roomId } });
  }
}

export const chatService = new ChatService();
