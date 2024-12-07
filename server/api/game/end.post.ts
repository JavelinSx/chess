import { GameService } from '~/server/services/game.service';
import type { GameResult } from '~/server/types/game';
import { gameSSEManager } from '~/server/utils/sseManager/GameSSEManager';

export default defineEventHandler(async (event) => {
  try {
    const { gameId, result } = await readBody<{
      gameId: string;
      result: GameResult;
    }>(event);

    if (!gameId || !result) {
      throw createError({
        statusCode: 400,
        message: 'Missing required parameters: gameId and result',
      });
    }

    const response = await GameService.endGame(gameId, result);

    if (response.error) {
      throw createError({
        statusCode: 400,
        message: response.error,
      });
    }

    // Закрываем соединения SSE с небольшой задержкой
    setTimeout(async () => {
      await gameSSEManager.closeGameConnections(gameId);
    }, 10000);

    return response;
  } catch (error) {
    console.error('Error ending game:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'An unknown error occurred while ending game',
    });
  }
});
