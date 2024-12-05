// server/api/chat/block/remove.post.ts
import { blockedService } from '~/server/services/chat/blocked.service';

export default defineEventHandler(async (event) => {
  const { roomId, userId } = await readBody(event);

  if (!roomId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID and user ID are required',
    });
  }

  try {
    const response = await blockedService.unblockUser(roomId, userId);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to unblock user',
    });
  }
});
