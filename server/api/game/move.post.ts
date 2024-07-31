// server/api/game/move.post.ts

import { getGameFromDatabase, saveGameToDatabase } from '~/server/services/game.service';
import { performMove } from '~/features/game-logic/model/chess-logic';
import { broadcastGameUpdate } from '~/server/api/sse/game-moves';

export default defineEventHandler(async (event) => {
  const { gameId, from, to } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!gameId || !from || !to || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body',
    });
  }

  const game = await getGameFromDatabase(gameId);

  if (!game) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Game not found',
    });
  }

  if (
    (game.currentTurn === 'white' && game.players.white !== userId) ||
    (game.currentTurn === 'black' && game.players.black !== userId)
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Not your turn',
    });
  }

  try {
    const { newBoard, updatedGame } = performMove(game, from, to);

    // Update game with new state
    Object.assign(game, updatedGame);

    await saveGameToDatabase(game);
    await broadcastGameUpdate(gameId, game);

    return { data: game, error: null };
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Invalid move',
    });
  }
});
