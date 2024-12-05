// server/api/chat/block/clean/[roomId].post.ts
import { blockedService } from '~/server/services/chat/blocked.service';

export default defineEventHandler(async (event) => {
  const roomId = event.context.params?.roomId;

  if (!roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID is required',
    });
  }

  try {
    const response = await blockedService.cleanExpiredBlocks(roomId);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to clean expired blocks',
    });
  }
});
