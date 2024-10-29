import { GameService } from '~/server/services/game.service';

export default defineEventHandler(async (event) => {
  const gameId = event.context.params?.id;
  const userId = event.context.auth?.userId;

  if (!gameId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid game ID or user ID',
    });
  }

  try {
    const gameResponse = await GameService.getGame(gameId);
    if (!gameResponse.data) {
      throw new Error(gameResponse.error || 'Game not found');
    }

    const game = gameResponse.data;

    if (game.players.white !== userId && game.players.black !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You are not a participant of this game',
      });
    }

    return { data: game, error: null };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
});
