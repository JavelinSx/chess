// server/api/game/[id].get.ts

import { getGameFromDatabase } from '~/server/services/game.service';

export default defineEventHandler(async (event) => {
  const gameId = event.context.params?.id;
  const userId = event.context.auth?.userId;

  if (!gameId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid game ID or user ID',
    });
  }

  const game = await getGameFromDatabase(gameId);

  if (!game) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Game not found',
    });
  }

  // Проверяем, является ли пользователь участником игры
  if (game.players.white !== userId && game.players.black !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not a participant of this game',
    });
  }

  return { data: game, error: null };
});
