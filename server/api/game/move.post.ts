import { defineEventHandler, readBody, createError } from 'h3';
import { performMove } from '~/features/game-logic/model/game-logic/move-execution';
import { getGameFromDatabase, saveGameToDatabase } from '~/server/services/game.service';
import { promotePawn } from '~/features/game-logic/model/game-logic/special-moves';
import { useRuntimeConfig } from '#app';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  console.log('Starting move handler');

  try {
    const { gameId, from, to, promoteTo } = await readBody(event);
    console.log('Received move request:', { gameId, from, to, promoteTo });

    const userId = event.context.auth?.userId;
    console.log('User ID from context:', userId);

    if (!userId) {
      console.log('User not authenticated');
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    let game = await getGameFromDatabase(gameId);
    console.log('Retrieved game from database:', JSON.stringify(game));

    if (!game) {
      console.log('Game not found');
      throw new Error('Game not found');
    }

    console.log('Current turn:', game.currentTurn);
    console.log('White player:', game.players.white);
    console.log('Black player:', game.players.black);

    const isWhiteTurn = game.currentTurn === 'white';
    const isPlayersTurn =
      (isWhiteTurn && game.players.white === userId) || (!isWhiteTurn && game.players.black === userId);

    console.log('Is white turn:', isWhiteTurn);
    console.log("Is player's turn:", isPlayersTurn);

    if (!isPlayersTurn) {
      console.log("Not player's turn");
      throw createError({ statusCode: 400, statusMessage: 'Not your turn' });
    }

    if (promoteTo) {
      console.log('Promoting pawn');
      game = promotePawn(game, from, to, promoteTo);
    } else {
      console.log('Performing regular move');
      game = performMove(game, from, to);
    }

    console.log('Updated game state:', JSON.stringify(game));

    await saveGameToDatabase(game);
    console.log('Game saved to database');

    // Отправляем обновление игры через SSE
    await sseManager.broadcastGameUpdate(gameId, game);
    console.log('Game update broadcasted');

    return { success: true, game };
  } catch (error: any) {
    console.error('Error in move handler:', error);
    throw createError({
      statusCode: error.statusCode || 400,
      statusMessage: error.statusMessage || error.message || 'Failed to make move',
    });
  }
});
