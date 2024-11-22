import mongoose from 'mongoose';
import ChatRoom from '../db/models/chat-room.model';
import User from '../db/models/user.model';
import { chatSSEManager } from '../utils/sseManager/ChatSSEManager';
import type { IChatRoom, ChatMessage, ChatParticipant } from '../types/chat';
import type { ChatSetting } from '../types/user';
import type { ApiResponse } from '~/server/types/api';

export class ChatService {
  static async createOrGetRoomWithPrivacyCheck(
    currentUserId: string,
    otherUserId: string,
    currentUserChatSetting: ChatSetting,
    otherUserChatSetting: ChatSetting
  ): Promise<ApiResponse<{ room: IChatRoom | null; canInteract: boolean }>> {
    try {
      const canInteract = this.canInteract(currentUserChatSetting, otherUserChatSetting);

      let room = await ChatRoom.findOne({
        'participants._id': { $all: [currentUserId, otherUserId] },
      });

      if (!room && canInteract) {
        const currentUser = await User.findById(currentUserId);
        const otherUser = await User.findById(otherUserId);

        if (!currentUser || !otherUser) {
          return { data: null, error: 'One or both users not found' };
        }

        room = new ChatRoom({
          participants: [
            { _id: currentUserId, username: currentUser.username, chatSetting: currentUser.chatSetting },
            { _id: otherUserId, username: otherUser.username, chatSetting: otherUser.chatSetting },
          ],
          messages: [],
          messageCount: 0,
          lastMessage: null,
        });

        await room.save();
      }

      return { data: { room: room?.toObject() || null, canInteract }, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred in createOrGetRoomWithPrivacyCheck',
      };
    }
  }

  static async updateUserChatPrivacy(userId: string, newChatSetting: ChatSetting): Promise<ApiResponse<void>> {
    try {
      // Находим все комнаты, в которых участвует пользователь
      const rooms = await ChatRoom.find({ 'participants._id': userId }).populate(
        'participants',
        '_id username chatSetting'
      );

      // Обновляем настройки пользователя в каждой комнате
      for (const room of rooms) {
        const userParticipant = room.participants.find((p) => p._id.toString() === userId);
        if (userParticipant) {
          userParticipant.chatSetting = newChatSetting;
          await chatSSEManager.sendChatRoomUpdateNotification(userParticipant?._id.toString(), room._id.toString());
          await room.save();
        }

        // Отправляем уведомление другому участнику комнаты
        const otherParticipant = room.participants.find((p) => p._id.toString() !== userId);
        if (otherParticipant) {
          await chatSSEManager.sendChatRoomUpdateNotification(otherParticipant._id.toString(), room._id.toString());
        }
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred while updating chat privacy',
      };
    }
  }

  static async getRoomsWithPrivacyCheck(
    userId: string,
    userChatSetting: ChatSetting
  ): Promise<ApiResponse<IChatRoom[]>> {
    try {
      const rooms = await ChatRoom.find({
        'participants._id': userId,
      })
        .populate('participants', '_id username chatSetting')
        .lean();

      const user = await User.findById(userId).populate('friends').lean();
      if (!user) {
        return { data: null, error: 'User not found' };
      }

      const roomsWithInteractionStatus = rooms.map((room) => {
        const otherParticipant = room.participants.find((p: any) => p._id.toString() !== userId);

        // Ensure canInteract is always boolean (true/false)
        const canInteract = this.canInteract(userChatSetting, otherParticipant?.chatSetting!) ?? false; // Fallback to false if undefined

        return {
          ...room,
          canSendMessage: canInteract, // Always returns a boolean
        };
      });

      return { data: roomsWithInteractionStatus, error: null };
    } catch (error) {
      console.error('Error in getRoomsWithPrivacyCheck:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred in getRoomsWithPrivacyCheck',
      };
    }
  }

  static async addMessage(
    roomId: string,
    user: { _id: string; username: string; chatSetting: ChatSetting },
    content: string
  ): Promise<ApiResponse<{ success: boolean; message: string; chatMessage: ChatMessage }>> {
    try {
      const room = await ChatRoom.findById(roomId).populate('participants', 'chatSetting');
      if (!room) {
        return { data: null, error: 'Chat room not found' };
      }

      const otherParticipant = room.participants.find((p) => p._id.toString() !== user._id);
      if (!otherParticipant) {
        return { data: null, error: 'Other participant not found' };
      }

      if (!this.canInteract(user.chatSetting, otherParticipant.chatSetting)) {
        return { data: null, error: 'Cannot send message due to privacy settings' };
      }

      if (!otherParticipant.chatSetting) {
        const otherUser = await User.findById(otherParticipant._id).select('chatSetting');
        if (otherUser) {
          otherParticipant.chatSetting = otherUser.chatSetting;
        } else {
          return { data: null, error: 'Failed to fetch other participant chat settings' };
        }
      }

      const chatMessage: ChatMessage = {
        _id: new mongoose.Types.ObjectId(),
        username: user.username,
        content,
        timestamp: Date.now(),
      };

      const updatedRoom = await ChatRoom.findByIdAndUpdate(
        roomId,
        {
          $push: { messages: chatMessage },
          $set: { lastMessage: chatMessage, lastMessageAt: new Date() },
          $inc: { messageCount: 1 },
        },
        { new: true }
      );

      if (!updatedRoom) {
        return { data: null, error: 'Failed to update chat room' };
      }
      await chatSSEManager.sendChatMessage(roomId, chatMessage);

      return {
        data: {
          success: true,
          message: 'Message sent successfully',
          chatMessage: chatMessage,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error in addMessage:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred in addMessage',
      };
    }
  }
  static async handleDeletedUser(userId: string): Promise<void> {
    const rooms = await ChatRoom.find({ 'participants._id': userId });

    for (const room of rooms) {
      const participantIndex = room.participants.findIndex((p) => p._id.toString() === userId);
      if (participantIndex !== -1) {
        room.participants[participantIndex] = {
          _id: new mongoose.Types.ObjectId(userId),
          username: 'Deleted User',
          chatSetting: 'nobody',
        };
        await room.save();
      }
    }
  }
  static canInteract(userChatSetting: ChatSetting, otherChatSetting: ChatSetting): boolean {
    if (userChatSetting === 'all' && otherChatSetting === 'all') {
      return true;
    }
    if (userChatSetting === 'nobody' || otherChatSetting === 'nobody') {
      return false;
    }
    if (userChatSetting === 'friends_only' || otherChatSetting === 'friends_only') {
      return true;
    }
    return true;
  }

  static async getRoomMessages(
    roomId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<
    ApiResponse<{
      messages: ChatMessage[];
      totalCount: number;
      currentPage: number;
      totalPages: number;
      isBlocked: boolean;
    }>
  > {
    try {
      const room = await ChatRoom.findById(roomId).populate('participants', 'chatSetting');
      if (!room) {
        return { data: null, error: 'Chat room not found' };
      }

      const otherParticipant = room.participants.find((p) => p._id.toString() !== userId);
      if (!otherParticipant) {
        return { data: null, error: 'Invalid room participants' };
      }

      const user = await User.findById(userId).select('chatSetting');
      if (!user) {
        return { data: null, error: 'User not found' };
      }

      const canInteract = await this.canInteract(user.chatSetting, otherParticipant.chatSetting);

      const totalCount = room.messageCount;
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;

      let messages: ChatMessage[] = [];

      messages = room.messages.slice(Math.max(0, totalCount - skip - limit), totalCount - skip).reverse();

      return {
        data: {
          messages,
          totalCount,
          currentPage: page,
          totalPages,
          isBlocked: !canInteract,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred in getRoomMessages',
      };
    }
  }

  static async getRoomByParticipants(userId1: string, userId2: string): Promise<ApiResponse<IChatRoom | null>> {
    try {
      const room = await ChatRoom.findOne({
        'participants._id': { $all: [userId1, userId2] },
      }).select('_id participants lastMessage messageCount createdAt updatedAt lastMessageAt');

      return { data: room, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred in getRoomByParticipants',
      };
    }
  }

  static async deleteRoom(roomId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const room = await ChatRoom.findById(roomId);
      if (!room) {
        return { data: null, error: 'Chat room not found' };
      }

      if (!room.participants.some((p) => p._id.toString() === userId)) {
        return { data: null, error: 'User is not a participant of this room' };
      }

      await ChatRoom.findByIdAndDelete(roomId);
      await User.updateMany({ _id: { $in: room.participants.map((p) => p._id) } }, { $pull: { chatRooms: roomId } });

      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'An unknown error occurred in deleteRoom' };
    }
  }
}
