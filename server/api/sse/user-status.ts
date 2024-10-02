// server/api/sse/user-status.ts
import { sseManager } from '~/server/utils/SSEManager';
import { UserService } from '~/server/services/user.service';

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

  sseManager.addUserConnection(userId, event);
  sseManager.addInvitationConnection(userId, event);
  sseManager.broadcastUserStatusUpdate(userId, { isOnline: true, isGame: false });

  await UserService.updateUserStatus(userId, true, false);

  const closeHandler = async () => {
    try {
      sseManager.removeUserConnection(userId);
      sseManager.removeInvitationConnection(userId);
      sseManager.broadcastUserStatusUpdate(userId, { isOnline: false, isGame: false });
      await UserService.updateUserStatus(userId, false, false);
    } catch (error) {
      console.error('Error in SSE close handler:', error);
    }
  };

  event.node.req.on('close', closeHandler);

  return new Promise(() => {});
});
