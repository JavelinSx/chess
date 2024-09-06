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
    room.lastMessageAt = new Date();

    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

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
      });
      await room.save();
    }

    return room;
  }

  async getRooms(_id: string): Promise<IChatRoom[]> {
    return ChatRoomModel.find({ 'participants._id': new mongoose.Types.ObjectId(_id) })
      .sort({ lastMessageAt: -1 })
      .lean();
  }

  async getRoomMessages(roomId: string): Promise<ChatMessage[]> {
    const room = await ChatRoomModel.findById(roomId).lean();
    if (!room) {
      throw new Error('Chat room not found');
    }
    return room.messages;
  }

  async getRoomByParticipants(_id1: string, _id2: string): Promise<IChatRoom | null> {
    const participantIds = [_id1, _id2].map((id) => new mongoose.Types.ObjectId(id)).sort();
    return ChatRoomModel.findOne({
      'participants._id': { $all: participantIds },
    }).lean();
  }
}

export const chatService = new ChatService();
