// server/api/chat/rooms.get.ts
import { chatService } from '~/server/services/chat.service';

// server/api/chat/rooms.get.ts
export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const rooms = await chatService.getRooms(userId);
    return { data: rooms, error: null };
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch rooms',
    };
  }
});
