import { getGameFromDatabase, saveGameToDatabase } from '~/server/services/game.service';
import { performMove } from '~/features/game-logic/model/game-logic/move-execution';
import { sseManager } from '~/server/utils/SSEManager';
import type { GameResult } from '~/server/types/game';
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
    const updatedGame = performMove(game, from, to);
    await saveGameToDatabase(updatedGame);

    // Отправка обновления через SSE
    await sseManager.broadcastGameUpdate(gameId, updatedGame);

    // Проверка на завершение игры
    if (updatedGame.status === 'completed') {
      const result: GameResult = {
        winner: updatedGame.winner,
        reason: updatedGame.winner ? 'checkmate' : 'draw',
      };
      await sseManager.sendGameEndNotification(gameId, result);
    }

    return { data: updatedGame, error: null };
  } catch (error) {
    console.error('Error performing move:', error);
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Invalid move',
    });
  }
});
