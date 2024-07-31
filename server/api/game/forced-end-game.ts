// server/api/game/forced-end-game.ts

import { defineEventHandler } from 'h3';
import type { PieceColor } from '~/entities/game/model/board.model';
import { forcedEndGame } from '~/server/services/game.service';
import { updateUserStats } from '~/server/services/user.service';
import { sendMessageToUsers } from '~/server/api/sse/user-status';
import { sendStatusUpdate } from '~/server/api/sse/user-status';

export default defineEventHandler(async (event) => {
  const { gameId } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!userId || !gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
    });
  }

  const { winner, loser, opponentId } = await forcedEndGame(gameId, userId);

  // Обновляем статистику игроков
  await updateUserStats(winner as string, 'win');
  await updateUserStats(loser, 'loss');

  // Отправляем уведомление обоим игрокам
  const gameEndMessage = JSON.stringify({
    type: 'game_end',
    gameId,
    winner,
    loser,
    reason: 'forfeit',
  });
  await sendMessageToUsers([userId, opponentId], gameEndMessage);

  // Обновляем статусы обоих игроков
  await sendStatusUpdate(winner as PieceColor, false, false);
  await sendStatusUpdate(loser, false, false);

  return { message: 'Game forfeited successfully' };
});
