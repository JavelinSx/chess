import { defineEventHandler, readBody, createError } from 'h3';
import { performMove } from '~/features/game-logic/model/game-logic/move-execution';
import { getGameFromDatabase, saveGameToDatabase } from '~/server/services/game.service';
import { promotePawn } from '~/features/game-logic/model/game-logic/special-moves';

export default defineEventHandler(async (event) => {
  const { gameId, from, to, promoteTo } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  try {
    let game = await getGameFromDatabase(gameId);
    if (!game) throw new Error('Game not found');

    if (
      (game.currentTurn === 'white' && game.players.white !== userId) ||
      (game.currentTurn === 'black' && game.players.black !== userId)
    ) {
      throw new Error('Not your turn');
    }

    if (promoteTo) {
      // Если это ход с продвижением пешки
      game = promotePawn(game, from, to, promoteTo);
    } else {
      // Обычный ход
      game = performMove(game, from, to);
    }
    await saveGameToDatabase(game);

    // Отправляем обновление игры через SSE
    await sseManager.broadcastGameUpdate(gameId, game);
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Failed to make move',
    });
  }
});
