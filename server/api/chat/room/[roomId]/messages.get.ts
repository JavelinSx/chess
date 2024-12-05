import { messageService } from '~/server/services/chat/message.service';

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
    const response = await messageService.getMessages(roomId, page, limit);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch messages',
    });
  }
});
