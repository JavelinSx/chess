// server/api/sse/user-status.ts
import { sseManager } from '~/server/utils/SSEManager';
import { UserService } from '~/server/services/user.service';
import { UserActivityService } from '~/server/services/user-activity.service';
import gameModel from '~/server/db/models/game.model';
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
  setHeader(event, 'Link', '</api/user/heartbeat>; rel="preconnect"');

  sseManager.addUserConnection(userId, event);
  sseManager.addInvitationConnection(userId, event);

  await UserActivityService.updateUserActivity(userId);
  if (import.meta.client) {
    window.addEventListener('beforeunload', () => {
      navigator.sendBeacon('/api/user/heartbeat', JSON.stringify({ userId }));
    });
  }

  await UserService.updateUserStatus(userId, true, false);

  const closeHandler = async () => {
    try {
      // Проверяем, не находится ли пользователь в активной игре
      const activeGame = await gameModel.findOne({
        $or: [{ 'players.white': userId }, { 'players.black': userId }],
        status: 'active',
      });

      sseManager.removeUserConnection(userId);
      sseManager.removeInvitationConnection(userId);

      // Если нет активной игры, только тогда меняем статус на offline
      if (!activeGame) {
        sseManager.broadcastUserStatusUpdate(userId, { isOnline: false, isGame: false });
        await UserService.updateUserStatus(userId, false, false);
      }
    } catch (error) {
      console.error('Error in SSE close handler:', error);
    }
  };

  event.node.req.on('close', closeHandler);

  return new Promise(() => {});
});
