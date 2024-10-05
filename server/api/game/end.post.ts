import { GameService } from '~/server/services/game.service';

export default defineEventHandler(async (event) => {
  const { gameId, result } = await readBody(event);
  console.log('Ending game request received:', gameId, result);

  try {
    const existingGame = await GameService.getGame(gameId);
    console.log('Existing game status:', existingGame.data?.status);

    if (existingGame.data && existingGame.data.status === 'completed') {
      console.log('Game already completed, ignoring request');
      return { data: existingGame.data.result, error: null };
    }

    const gameResult = await GameService.endGame(gameId, result);
    console.log('Game end result:', gameResult);

    return { data: gameResult, error: null };
  } catch (error) {
    console.error('Error ending game:', error);
    return { data: null, error: 'Failed to end game' };
  }
});
