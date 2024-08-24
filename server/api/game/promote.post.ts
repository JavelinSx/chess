import { defineEventHandler, readBody, createError } from 'h3';
import { getGameFromDatabase, saveGameToDatabase } from '~/server/services/game.service';
import { promotePawn } from '~/features/game-logic/model/game-logic/special-moves';
import { sseManager } from '#build/types/nitro-imports';

export default defineEventHandler(async (event) => {
  const { gameId, to, promoteTo } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  try {
    const game = await getGameFromDatabase(gameId);
    if (!game) throw new Error('Game not found');
    if (!game.pendingPromotion) throw new Error('No pending promotion');

    if (
      (game.currentTurn === 'white' && game.players.white !== userId) ||
      (game.currentTurn === 'black' && game.players.black !== userId)
    ) {
      throw new Error('Not your turn');
    }

    const updatedGame = promotePawn(game, to, promoteTo);
    await saveGameToDatabase(updatedGame);

    // Отправляем обновление игры через SSE
    await sseManager.broadcastGameUpdate(gameId, updatedGame);

    return { status: 'promotion_completed', game: updatedGame };
  } catch (error) {
    console.error('Error promoting pawn:', error);
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Failed to promote pawn',
    });
  }
});
