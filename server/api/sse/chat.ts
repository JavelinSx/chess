// server/api/sse/chat.ts
import { chatSSEManager } from '~/server/utils/sseManager/ChatSSEManager';

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  setHeader(event, 'Content-Type', 'text/event-stream');
  setHeader(event, 'Cache-Control', 'no-cache');
  setHeader(event, 'Connection', 'keep-alive');

  await chatSSEManager.addChatConnection(userId, event);

  const closeHandler = async () => {
    await chatSSEManager.removeChatConnection(userId);
  };

  event.node.req.on('close', closeHandler);

  return new Promise(() => {});
});
