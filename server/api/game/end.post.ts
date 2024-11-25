import { GameService } from '~/server/services/game.service';

export default defineEventHandler(async (event) => {
  const { gameId, result } = await readBody(event);

  try {
    const existingGame = await GameService.getGame(gameId);

    if (existingGame.data && existingGame.data.status === 'completed') {
      return { data: existingGame.data.result, error: null };
    }

    const gameResult = await GameService.endGame(gameId, result);

    return gameResult;
  } catch (error) {
    return { data: null, error: 'Failed to end game' };
  }
});
