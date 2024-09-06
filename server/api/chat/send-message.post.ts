import { chatService } from '~/server/services/chat.service';
import { sseManager } from '~/server/utils/SSEManager';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomId, content, _id, username } = body;

  if (!roomId || !content || !_id || !username) {
    console.error('Missing fields:', { roomId, content, _id, username });
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    });
  }

  try {
    const message = await chatService.addMessage(roomId, { _id, username }, content);

    // Отправляем сообщение через SSE
    await sseManager.sendChatMessage(roomId, message);

    return { message };
  } catch (error) {
    console.error('Error sending message:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});
