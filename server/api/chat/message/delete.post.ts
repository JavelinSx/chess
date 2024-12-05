// server/api/chat/message/delete.post.ts
import { messageService } from '~/server/services/chat/message.service';

export default defineEventHandler(async (event) => {
  const { roomId, messageId } = await readBody(event);

  if (!roomId || !messageId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID and message ID are required',
    });
  }

  try {
    const response = await messageService.deleteMessage(roomId, messageId);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to delete message',
    });
  }
});
