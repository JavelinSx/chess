// server/api/chat/delete-room.ts

import { ChatService } from '~/server/services/chat.service';

export default defineEventHandler(async (event) => {
  const { roomId } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!userId || !roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
    });
  }

  try {
    const response = await ChatService.deleteRoom(roomId, userId);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete chat room',
    });
  }
});
