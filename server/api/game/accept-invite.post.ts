// server/api/game/accept-invite.post.ts

import { sseManager } from '~/server/utils/SSEManager';
import { GameService } from '~/server/services/game.service';
import { updateUserStatus } from '~/server/services/user.service';

export default defineEventHandler(async (event) => {
  const { inviterId } = await readBody(event);
  const inviteeId = event.context.auth?.userId;

  if (!inviteeId || !inviterId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
    });
  }

  const game = await GameService.createGame(inviterId, inviteeId);

  // Назначаем цвета игрокам случайным образом
  const isWhite = Math.random() < 0.5;
  await GameService.setPlayerColor(game.id, inviterId, isWhite ? 'white' : 'black');
  await GameService.setPlayerColor(game.id, inviteeId, isWhite ? 'black' : 'white');

  await GameService.updateGameStatus(game.id, 'active');
  if (game.players.white && game.players.black) {
    await updateUserStatus(game.players.white, true, true);
    await updateUserStatus(game.players.black, true, true);
  }

  // Отправляем уведомление о начале игры через пользовательский SSE канал
  await sseManager.sendGameStartNotification(game.id, [inviterId, inviteeId]);

  return { data: { gameId: game.id }, error: null };
});
