// server/api/sse/chat.ts
import { sseManager } from '~/server/utils/SSEManager';

export default defineEventHandler(async (event) => {
  console.log('Chat SSE endpoint hit');
  const userId = event.context.auth?.userId;
  if (!userId) {
    console.log('Unauthorized access attempt');
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  console.log(`Setting up SSE for user ${userId}`);

  setHeader(event, 'Content-Type', 'text/event-stream');
  setHeader(event, 'Cache-Control', 'no-cache');
  setHeader(event, 'Connection', 'keep-alive');

  sseManager.addChatConnection(userId, event);

  const closeHandler = () => {
    console.log(`Closing SSE connection for user ${userId}`);
    sseManager.removeChatConnection(userId);
  };

  event.node.req.on('close', closeHandler);

  console.log(`SSE connection established for user ${userId}`);

  return new Promise(() => {});
});
