import { defineEventHandler, readBody, createError } from 'h3';
import { GameService } from '~/server/services/game.service';
import { isValidMove, promotePawn, performMove } from '~/shared/game-logic';
import { gameSSEManager } from '../../utils/sseManager/GameSSEManager';

export default defineEventHandler(async (event) => {
  try {
    const { gameId, from, to, promoteTo, whiteTime, blackTime } = await readBody(event);
    const userId = event.context.auth?.userId;
    if (!userId) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const gameResponse = await GameService.getGame(gameId);
    if (gameResponse.error || !gameResponse.data) {
      throw new Error(gameResponse.error || 'Game not found');
    }
    let game = gameResponse.data;

    const isWhiteTurn = game.currentTurn === 'white';
    const isPlayersTurn =
      (isWhiteTurn && game.players.white?._id.toString() === userId) ||
      (!isWhiteTurn && game.players.black?._id.toString() === userId);

    if (!isPlayersTurn) {
      throw createError({ statusCode: 400, statusMessage: 'Not your turn' });
    }

    if (!isValidMove(game, from, to)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid move' });
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

    const gameTest = await GameService.getGame(gameId);
    game = gameTest.data!;
    game.whiteTime = whiteTime;
    game.blackTime = blackTime;

    await gameSSEManager.broadcastGameUpdate(gameId, game);
    await GameService.updateGameTimer(gameId, whiteTime, blackTime);
    return { data: { success: true }, error: null };
  } catch (error: any) {
    console.error('Error in move handler:', error);
    throw createError({
      statusCode: error.statusCode || 400,
      statusMessage: error.statusMessage || error.message || 'Failed to make move',
    });
  }
});
