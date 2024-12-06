// /server/api/chat/rooms.get.ts
import { roomService } from '~/server/services/chat/room.service';

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;

  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  try {
    const response = await roomService.getRooms(userId);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch rooms',
    });
  }
});
