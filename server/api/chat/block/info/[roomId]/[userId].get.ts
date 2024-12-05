// server/api/chat/block/info/[roomId]/[userId].get.ts
import { blockedService } from '~/server/services/chat/blocked.service';

export default defineEventHandler(async (event) => {
  const roomId = event.context.params?.roomId;
  const userId = event.context.params?.userId;

  if (!roomId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID and user ID are required',
    });
  }

  try {
    const response = await blockedService.getBlockInfo(roomId, userId);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to get block info',
    });
  }
});
