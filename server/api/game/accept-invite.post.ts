// server/api/game/accept-invite.post.ts

import { sendMessageToUsers } from '~/server/api/sse/user-status';
import { createGame, setPlayerColor, updateGameStatus } from '~/server/services/game.service';

export default defineEventHandler(async (event) => {
  const { inviterId } = await readBody(event);
  const inviteeId = event.context.auth?.userId;

  if (!inviteeId || !inviterId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
    });
  }

  const game = await createGame(inviterId, inviteeId);

  // Назначаем цвета игрокам случайным образом
  const isWhite = Math.random() < 0.5;
  await setPlayerColor(game.id, inviterId, isWhite ? 'white' : 'black');
  await setPlayerColor(game.id, inviteeId, isWhite ? 'black' : 'white');

  await updateGameStatus(game.id, 'active');

  // Отправляем уведомление обоим игрокам о начале игры
  const gameStartMessage = JSON.stringify({ type: 'game_start', gameId: game.id });
  await sendMessageToUsers([inviterId, inviteeId], gameStartMessage);

  return { data: { gameId: game.id }, error: null };
});
