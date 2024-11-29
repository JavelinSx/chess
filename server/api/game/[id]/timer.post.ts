import { GameService } from '~/server/services/game.service';

export default defineEventHandler(async (event) => {
  const gameId = event.context.params?.id;
  const { whiteTime, blackTime } = await readBody(event);

  if (!gameId) {
    throw createError({
      statusCode: 400,
      message: 'Game ID is required',
    });
  }

  const response = await GameService.updateGameTimer(gameId, whiteTime, blackTime);

  if (response.error) {
    throw createError({
      statusCode: 400,
      message: response.error,
    });
  }

  return { success: true };
});
