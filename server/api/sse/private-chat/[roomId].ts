import ChatRoomModel from '~/server/db/models/chat-room.model';
import { privateChatSSEManager } from '~/server/utils/sseManager/chat/PrivateChatSSEManager';

// server/api/sse/private-chat/[roomId].ts
export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;
  const roomId = event.context.params?.roomId;

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  if (!roomId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not roomId',
    });
  }

  // Проверяем, что пользователь имеет доступ к комнате
  const room = await ChatRoomModel.findById(roomId);

  if (!room || !room.participants.some((p) => p.userId.toString() === userId)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied',
    });
  }

  setHeader(event, 'Content-Type', 'text/event-stream');
  setHeader(event, 'Cache-Control', 'no-cache');
  setHeader(event, 'Connection', 'keep-alive');

  await privateChatSSEManager.addConnection(roomId, userId, event);

  const closeHandler = async () => {
    await privateChatSSEManager.removeConnection(roomId, userId);
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
