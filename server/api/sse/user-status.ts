import { UserService } from '~/server/services/user.service';
import { UserActivityService } from '~/server/services/user-activity.service';
import gameModel from '~/server/db/models/game.model';
import { userSSEManager } from '~/server/utils/sseManager/UserSSEManager';

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
  setHeader(event, 'Link', '</api/user/heartbeat>; rel="preconnect">');

  // Подключение пользователя к SSE
  await userSSEManager.addUserConnection(userId, event);
  // Добавляем пользователя в кэш
  await UserActivityService.updateUserActivity(userId, event);

  // Обновляем статус пользователя
  await UserService.updateUserStatus(userId, true, false);

  // Обработчик закрытия соединения
  const closeHandler = async () => {
    try {
      const activeGame = await gameModel.findOne({
        $or: [{ 'players.white._id': userId }, { 'players.black._id': userId }],
        status: 'active',
      });

      await userSSEManager.removeUserConnection(userId);

      if (!activeGame) {
        await userSSEManager.broadcastUserStatusUpdate(userId, { isOnline: false, isGame: false });
        await UserService.updateUserStatus(userId, false, false);
      }
    } catch (error) {
      console.error('Error in SSE close handler:', error);
    }
  };

  event.node.req.on('close', closeHandler);

  return new Promise(() => {}); // Удерживаем SSE-соединение
});
