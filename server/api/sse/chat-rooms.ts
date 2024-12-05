import { chatRoomsSSEManager } from '~/server/utils/sseManager/chat/ChatRoomSSEManager';

// server/api/sse/chat-rooms.ts
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

  await chatRoomsSSEManager.addConnection(userId, event);

  const closeHandler = async () => {
    await chatRoomsSSEManager.removeConnection(userId);
  };

  const keepAliveInterval = setInterval(() => {
    event.node.res.write(':\n\n');
  }, 10000);

  event.node.req.on('close', () => {
    clearInterval(keepAliveInterval);
    closeHandler();
  });

  return new Promise(() => {});
});
