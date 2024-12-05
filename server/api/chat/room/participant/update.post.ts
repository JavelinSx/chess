// server/api/chat/room/participant/update.post.ts
import { roomService } from '~/server/services/chat/room.service';

export default defineEventHandler(async (event) => {
  const { roomId, userId, updates } = await readBody(event);

  if (!roomId || !userId || !updates) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required participant data',
    });
  }

  try {
    const response = await roomService.updateParticipant(roomId, userId, updates);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to update participant',
    });
  }
});
