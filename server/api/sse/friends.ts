// server/api/sse/friends.ts
import { friendsSSEManager } from '~/server/utils/sseManager/FriendsSSEManager';

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

  await friendsSSEManager.addFriendConnection(userId, event);

  const closeHandler = async () => {
    await friendsSSEManager.removeFriendConnection(userId);
  };

  event.node.req.on('close', closeHandler);

  return new Promise(() => {});
});
