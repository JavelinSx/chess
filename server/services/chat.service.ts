// server/services/chat.service.ts

import ChatMessage from '~/server/db/models/chat.model';
import ChatRoom from '~/server/db/models/chatRoom.model';
import User from '../db/models/user.model';
import { sanitizeUserHtml } from '~/server/utils/sanitizeHtml';
import { sseManager } from '../utils/SSEManager';

import type {
  ChatMessage as ChatMessageType,
  ChatRoom as ChatRoomType,
  ClientChatMessage,
  ClientChatRoom,
} from '../types/chat';
import type { ObjectId } from 'mongoose';

export const chatService = {
  async sendMessage(senderId: ObjectId, receiverId: ObjectId, content: string): Promise<ChatMessageType> {
    const sanitizedContent = sanitizeUserHtml(content);
    const message = new ChatMessage({
      sender: senderId,
      receiver: receiverId,
      content: sanitizedContent,
    });
    await message.save();

    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!chatRoom) {
      chatRoom = new ChatRoom({
        participants: [senderId, receiverId],
        lastMessage: message,
        unreadCount: 1,
      });
    } else {
      chatRoom.lastMessage = message;
      chatRoom.unreadCount += 1;
    }
    await chatRoom.save();

    const [sender, receiver] = await Promise.all([User.findById(senderId), User.findById(receiverId)]);

    const clientMessage: ClientChatMessage = {
      id: message.id,
      senderId: senderId.toString(),
      senderName: sender?.username || 'Unknown',
      receiverId: receiverId.toString(),
      receiverName: receiver?.username || 'Unknown',
      content: sanitizedContent,
      timestamp: message.timestamp.toISOString(),
      status: message.status,
      isEdited: message.isEdited,
    };

    // Отправляем SSE событие получателю
    await sseManager.sendChatMessage(receiverId.toString(), clientMessage);

    return message.toObject();
  },

  async getMessages(userId: ObjectId, otherId: ObjectId): Promise<ChatMessageType[]> {
    const messages = await ChatMessage.find({
      $or: [
        { sender: userId, receiver: otherId },
        { sender: otherId, receiver: userId },
      ],
    }).sort({ timestamp: 1 });

    return messages.map((message) => message.toObject());
  },

  async getChatRooms(userId: ObjectId): Promise<ChatRoomType[]> {
    const chatRooms = await ChatRoom.find({
      participants: userId,
    })
      .populate('lastMessage')
      .populate('participants', 'username');

    return chatRooms.map((room) => room.toObject());
  },

  async deleteChat(userId: ObjectId, otherId: ObjectId): Promise<void> {
    await ChatMessage.deleteMany({
      $or: [
        { sender: userId, receiver: otherId },
        { sender: otherId, receiver: userId },
      ],
    });
    await ChatRoom.deleteOne({
      participants: { $all: [userId, otherId] },
    });
  },

  async updateMessageStatus(messageId: ObjectId, status: 'delivered' | 'read'): Promise<void> {
    const message = await ChatMessage.findByIdAndUpdate(messageId, { status }, { new: true });
    if (message) {
      const room = await ChatRoom.findOne({ lastMessage: messageId }).populate('participants');
      if (room) {
        const [sender, receiver] = await Promise.all([User.findById(message.sender), User.findById(message.receiver)]);

        const clientRoom: ClientChatRoom = {
          id: room._id.toString(),
          participantIds: room.participants.map((p) => p.toString()),
          lastMessage: {
            id: message.id,
            senderId: message.sender.toString(),
            senderName: sender?.username || 'Unknown',
            receiverId: message.receiver.toString(),
            receiverName: receiver?.username || 'Unknown',
            content: message.content,
            timestamp: message.timestamp.toISOString(),
            status: message.status,
            isEdited: message.isEdited,
          },
          unreadCount: room.unreadCount,
        };

        // Отправляем обновление статуса сообщений отправителю
        const senderId = room.participants.find((p) => p.toString() !== message.receiver.toString())?.toString();
        if (senderId) {
          await sseManager.sendChatRoomUpdate(senderId, clientRoom);
        }
      }
    }
  },

  async markAsRead(userId: string, roomId: string): Promise<void> {
    const room = await ChatRoom.findByIdAndUpdate(roomId, { unreadCount: 0 }, { new: true }).populate('participants');
    if (room && room.lastMessage) {
      const [sender, receiver] = await Promise.all([
        User.findById(room.lastMessage.sender),
        User.findById(room.lastMessage.receiver),
      ]);

      const clientRoom: ClientChatRoom = {
        id: room._id.toString(),
        participantIds: room.participants.map((p) => p.toString()),
        lastMessage: {
          id: room.lastMessage._id.toString(),
          senderId: room.lastMessage.sender.toString(),
          senderName: sender?.username || 'Unknown',
          receiverId: room.lastMessage.receiver.toString(),
          receiverName: receiver?.username || 'Unknown',
          content: room.lastMessage.content,
          timestamp: room.lastMessage.timestamp.toISOString(),
          status: 'read',
          isEdited: room.lastMessage.isEdited,
        },
        unreadCount: 0,
      };

      // Отправляем обновление статуса сообщений отправителю
      const senderId = room.participants.find((p) => p.toString() !== userId)?.toString();
      if (senderId) {
        await sseManager.sendChatRoomUpdate(senderId, clientRoom);
      }
    }
  },
};
