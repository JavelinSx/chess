// server/api/chat/block/duration.post.ts
import { blockedService } from '~/server/services/chat/blocked.service';

export default defineEventHandler(async (event) => {
  const { roomId, userId, newBlockedUntil } = await readBody(event);

  if (!roomId || !userId || !newBlockedUntil) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required block duration data',
    });
  }

  try {
    const response = await blockedService.updateBlockDuration(roomId, userId, new Date(newBlockedUntil));
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to update block duration',
    });
  }
});
