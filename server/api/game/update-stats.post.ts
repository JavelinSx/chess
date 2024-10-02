// server/api/game/update-stats.post.ts

import { defineEventHandler } from 'h3';
import { GameService } from '~/server/services/game.service';
import type { GameResult } from '~/server/types/game';
import type { UserStats } from '~/server/types/user';

export default defineEventHandler(async (event) => {
  try {
    const { gameId, result } = await readBody(event);

    if (!gameId || !result) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: gameId and result are required',
      });
    }

    const response = await GameService.updateGameStats(gameId, result as GameResult);

    if (response.error) {
      throw createError({
        statusCode: 500,
        statusMessage: response.error,
      });
    }

    return response;
  } catch (error) {
    console.error('Error updating game stats:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
});
