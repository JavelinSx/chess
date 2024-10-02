import { defineEventHandler, readBody, createError } from 'h3';
import { performMove } from '~/features/game-logic/model/game-logic/move-execution';
import { GameService } from '~/server/services/game.service';
import { promotePawn } from '~/features/game-logic/model/game-logic/special-moves';
import { sseManager } from '~/server/utils/SSEManager';

export default defineEventHandler(async (event) => {
  try {
    const { gameId, from, to, promoteTo } = await readBody(event);
    const userId = event.context.auth?.userId;
    if (!userId) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const gameResponse = await GameService.getGame(gameId);
    if (!gameResponse.data) {
      throw new Error(gameResponse.error || 'Game not found');
    }

    let game = gameResponse.data;

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

    const saveResponse = await GameService.saveGame(game);
    if (saveResponse.error) {
      throw new Error(saveResponse.error);
    }

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
