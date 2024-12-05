// server/api/chat/room/delete.post.ts
import { roomService } from '~/server/services/chat/room.service';

export default defineEventHandler(async (event) => {
  const { roomId } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!roomId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID and user ID are required',
    });
  }

  try {
    const response = await roomService.deleteRoom(roomId, userId);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to delete room',
    });
  }
});
