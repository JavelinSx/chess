// server/api/chat/sse.ts

import { chatService } from '~/server/services/chat.service';

export default defineEventHandler((event) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };

  setHeaders(event, headers);

  const userId = event.context.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  // Здесь мы будем отправлять события клиенту
  // Это будет реализовано позже

  return new Promise(() => {});
});
