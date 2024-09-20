// server/api/chat/room/[roomId]/messages.get.ts
import { chatService } from '~/server/services/chat.service';

export default defineEventHandler(async (event) => {
  const { roomId } = getRouterParams(event);
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 50;

  if (!roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID is required',
    });
  }

  const userId = event.context.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const result = await chatService.getRoomMessages(roomId, userId, page, limit);

    return {
      data: result,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching room messages:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch room messages',
    });
  }
});
