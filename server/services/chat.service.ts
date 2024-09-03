// server/services/chat.service.ts

import ChatRoom from '~/server/db/models/chatRoom.model';
import User from '../db/models/user.model';
import mongoose from 'mongoose';
import { sanitizeUserHtml } from '~/server/utils/sanitizeHtml';
import { sseManager } from '../utils/SSEManager';
import type { ChatRoom as ChatRoomType, ClientChatMessage, ClientChatRoom } from '../types/chat';

export const chatService = {
  async createChatRoom(userId1: string, userId2: string): Promise<ClientChatRoom> {
    const participantIds = [userId1, userId2].sort().map((id) => new mongoose.Types.ObjectId(id));

    let room = await ChatRoom.findOne({
      participants: { $all: participantIds },
    });

    if (!room) {
      room = new ChatRoom({
        participants: participantIds,
        messages: [],
        lastMessage: null,
        unreadCount: 0,
      });
      await room.save();
    }

    return this.mapChatRoomToClientChatRoom(room);
  },

  async sendMessage(roomId: string, senderId: string, content: string): Promise<ClientChatMessage> {
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const roomObjectId = new mongoose.Types.ObjectId(roomId);

    const sanitizedContent = sanitizeUserHtml(content);
    const newMessage = {
      senderId: senderObjectId,
      content: sanitizedContent,
      timestamp: new Date(),
      status: 'sent',
      isEdited: false,
    };

    const room = await ChatRoom.findByIdAndUpdate(
      roomObjectId,
      {
        $push: { messages: newMessage },
        $set: { lastMessage: newMessage },
        $inc: { unreadCount: 1 },
      },
      { new: true }
    ).populate('participants', 'username');

    if (!room) {
      throw new Error('Chat room not found');
    }

    const clientMessage = await this.mapChatMessageToClientChatMessage(newMessage, room);

    // Отправляем SSE события всем участникам чата
    for (const participantId of room.participants) {
      await sseManager.sendChatMessage(participantId.toString(), clientMessage);
    }

    // Отправляем обновление комнаты всем участникам
    const clientRoom = this.mapChatRoomToClientChatRoom(room);
    for (const participantId of room.participants) {
      await sseManager.sendChatRoomUpdate(participantId.toString(), clientRoom);
    }

    return clientMessage;
  },

  async getMessages(roomId: string): Promise<ClientChatMessage[]> {
    const room = await ChatRoom.findById(roomId).populate('participants', 'username');
    if (!room) {
      throw new Error('Chat room not found');
    }

    return Promise.all(room.messages.map((msg) => this.mapChatMessageToClientChatMessage(msg, room)));
  },

  async getChatRooms(userId: string): Promise<ClientChatRoom[]> {
    const chatRooms = await ChatRoom.find({
      participants: new mongoose.Types.ObjectId(userId),
    }).populate('participants', 'username');

    return chatRooms.map(this.mapChatRoomToClientChatRoom);
  },

  async markAsRead(roomId: string, userId: string): Promise<void> {
    const room = await ChatRoom.findByIdAndUpdate(roomId, { $set: { unreadCount: 0 } }, { new: true }).populate(
      'participants',
      'username'
    );

    if (room) {
      const clientRoom = this.mapChatRoomToClientChatRoom(room);
      // Отправляем обновление статуса всем участникам
      for (const participant of room.participants) {
        await sseManager.sendChatRoomUpdate(participant._id.toString(), clientRoom);
      }
    }
  },

  async mapChatMessageToClientChatMessage(message: any, room: any): Promise<ClientChatMessage> {
    const sender = room.participants.find((p: any) => p._id.toString() === message.senderId.toString());
    return {
      id: message._id.toString(),
      senderId: message.senderId.toString(),
      senderName: sender ? sender.username : 'Unknown',
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      status: message.status,
      isEdited: message.isEdited,
    };
  },

  mapChatRoomToClientChatRoom(room: ChatRoomType): ClientChatRoom {
    return {
      id: room._id.toString(),
      participantIds: room.participants.map((p) => p.toString()),
      messages: room.messages.map((msg) => ({
        id: msg._id!.toString(),
        senderId: msg.senderId.toString(),
        senderName: 'Unknown', // Это поле нужно будет заполнить отдельно
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        status: msg.status,
        isEdited: msg.isEdited,
      })),
      lastMessage: room.lastMessage
        ? {
            id: room.lastMessage._id!.toString(),
            senderId: room.lastMessage.senderId.toString(),
            senderName: 'Unknown', // Это поле нужно будет заполнить отдельно
            content: room.lastMessage.content,
            timestamp: room.lastMessage.timestamp.toISOString(),
            status: room.lastMessage.status,
            isEdited: room.lastMessage.isEdited,
          }
        : null,
      unreadCount: room.unreadCount,
    };
  },
};
