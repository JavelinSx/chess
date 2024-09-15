import { GameService } from '~/server/services/game.service';

export default defineEventHandler(async (event) => {
  const { gameId } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!userId || !gameId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
    });
  }

  try {
    await GameService.forcedEndGame(gameId, userId);
    return { success: true, message: 'Game forfeited successfully' };
  } catch (error) {
    console.error('Error in forced end game:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'An error occurred during game end',
    });
  }
});
