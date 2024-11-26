import { GameService } from '~/server/services/game.service';

export default defineEventHandler(async (event) => {
  const { gameId, result } = await readBody(event);

  try {
    const gameResult = await GameService.endGame(gameId, result);

    setTimeout(async () => {
      await gameSSEManager.closeGameConnections(gameId);
    }, 10000);

    return gameResult;
  } catch (error) {
    return { data: null, error: 'Failed to end game' };
  }
});
