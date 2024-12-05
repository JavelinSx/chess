// server/api/chat/block/add.post.ts
import { blockedService } from '~/server/services/chat/blocked.service';

export default defineEventHandler(async (event) => {
  const { roomId, userId, blockedUntil, reason } = await readBody(event);

  if (!roomId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID and user ID are required',
    });
  }

  try {
    const response = await blockedService.blockUser(roomId, userId, blockedUntil, reason);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to block user',
    });
  }
});
