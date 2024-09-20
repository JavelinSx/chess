// server/api/chat/delete-room.ts

import { chatService } from '~/server/services/chat.service';

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
    await chatService.deleteRoom(roomId, userId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting chat room:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete chat room',
    });
  }
});
