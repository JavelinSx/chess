// server/api/chat/room/[roomId]/messages.get.ts
import { chatService } from '~/server/services/chat.service';

export default defineEventHandler(async (event) => {
  const roomId = event.context.params?.roomId;
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 50;

  if (!roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID is required',
    });
  }

  try {
    const { messages, totalCount, currentPage, totalPages } = await chatService.getRoomMessages(roomId, page, limit);
    return {
      data: {
        messages,
        totalCount,
        currentPage,
        totalPages,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching room messages:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch room messages',
    };
  }
});
