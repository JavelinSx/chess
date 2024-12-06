// /server/api/chat/message/send.post.ts
import { messageService } from '~/server/services/chat/message.service';

export default defineEventHandler(async (event) => {
  const { roomId, content } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!roomId || !content || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required message data',
    });
  }

  try {
    const response = await messageService.sendMessage(roomId, userId, content);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to send message',
    });
  }
});
