import { defineEventHandler, readBody, createError } from 'h3';
import { performMove } from '~/features/game-logic/model/game-logic/move-execution';
import { GameService } from '~/server/services/game.service';
import { promotePawn } from '~/features/game-logic/model/game-logic/special-moves';

export default defineEventHandler(async (event) => {
  try {
    const { gameId, from, to, promoteTo } = await readBody(event);
    const userId = event.context.auth?.userId;
    if (!userId) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    let game = await GameService.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const isWhiteTurn = game.currentTurn === 'white';
    const isPlayersTurn =
      (isWhiteTurn && game.players.white === userId) || (!isWhiteTurn && game.players.black === userId);

    if (!isPlayersTurn) {
      throw createError({ statusCode: 400, statusMessage: 'Not your turn' });
    }

    if (promoteTo) {
      game = promotePawn(game, from, to, promoteTo);
    } else {
      game = performMove(game, from, to);
    }

    await GameService.saveGame(game);
    // Отправляем обновление игры через SSE
    await sseManager.broadcastGameUpdate(gameId, game);
    return { data: game, error: null };
  } catch (error: any) {
    console.error('Error in move handler:', error);
    throw createError({
      statusCode: error.statusCode || 400,
      statusMessage: error.statusMessage || error.message || 'Failed to make move',
    });
  }
});
