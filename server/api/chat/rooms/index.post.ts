// server/api/chat/rooms/index.post.ts
import { defineEventHandler, readBody } from 'h3';
import chatRoomModel from '~/server/db/models/chatRoom.model';
import type { ClientChatRoom } from '~/server/types/chat';
import { chatService } from '~/server/services/chat.service';
export default defineEventHandler(async (event) => {
  const { otherUserId } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!userId || !otherUserId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
    });
  }

  try {
    const room = await chatService.createChatRoom(userId, otherUserId);
    console.log('Created room:', JSON.stringify(room, null, 2));

    return {
      data: {
        id: room._id.toString(),
        participantIds: room.participants.map((p) => p.toString()),
        lastMessage: room.lastMessage,
        unreadCount: room.unreadCount,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error creating chat room:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create chat room',
    });
  }
});
