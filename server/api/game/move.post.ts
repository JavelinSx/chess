import { defineEventHandler, readBody, createError } from 'h3';
import { performMove } from '~/features/game-logic/model/game-logic/move-execution';
import { getGameFromDatabase, saveGameToDatabase } from '~/server/services/game.service';
import { sseManager } from '#build/types/nitro-imports';

export default defineEventHandler(async (event) => {
  const { gameId, from, to } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  try {
    const game = await getGameFromDatabase(gameId);
    if (!game) throw new Error('Game not found');

    if (
      (game.currentTurn === 'white' && game.players.white !== userId) ||
      (game.currentTurn === 'black' && game.players.black !== userId)
    ) {
      throw new Error('Not your turn');
    }

    const updatedGame = performMove(game, from, to);
    await saveGameToDatabase(updatedGame);

    // Отправляем обновление игры через SSE
    await sseManager.broadcastGameUpdate(gameId, updatedGame);

    if (updatedGame.pendingPromotion) {
      return { status: 'promotion_needed', game: updatedGame };
    } else {
      return { status: 'move_completed', game: updatedGame };
    }
  } catch (error) {
    console.error('Error making move:', error);
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Failed to make move',
    });
  }
});
