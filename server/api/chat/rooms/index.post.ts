// server/api/chat/rooms/index.post.ts
import { defineEventHandler, readBody } from 'h3';
import chatRoomModel from '~/server/db/models/chatRoom.model';
import type { ClientChatRoom } from '~/server/types/chat';

export default defineEventHandler(async (event) => {
  const { otherUserId } = await readBody(event);
  const currentUserId = event.context.auth?.userId;

  if (!currentUserId || !otherUserId) {
    return { data: null, error: 'Both user IDs are required' };
  }

  try {
    let chatRoom = await chatRoomModel.findOne({
      participantIds: { $all: [currentUserId, otherUserId] },
    });

    if (!chatRoom) {
      chatRoom = new chatRoomModel({
        participantIds: [currentUserId, otherUserId],
        lastMessage: null,
        unreadCount: 0,
      });
      await chatRoom.save();
    }

    // Преобразуем данные в формат ClientChatRoom
    const clientChatRoom: ClientChatRoom = {
      id: chatRoom._id.toString(),
      participantIds: chatRoom.participants.map((id) => id.toString()),
      lastMessage: null, // Преобразуйте lastMessage, если оно есть
      unreadCount: chatRoom.unreadCount,
    };

    return { data: clientChatRoom, error: null };
  } catch (error) {
    console.error('Error creating chat room:', error);
    return { data: null, error: 'Failed to create chat room' };
  }
});
