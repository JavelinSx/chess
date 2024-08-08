// server/api/sse/game-moves.ts
import { sseManager } from '~/server/utils/SSEManager';
import { getGameFromDatabase } from '~/server/services/game.service';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const gameId = query.gameId as string;
  const userId = event.context.auth?.userId;

  if (!gameId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid game ID or user ID',
    });
  }

  const game = await getGameFromDatabase(gameId);

  if (!game) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Game not found',
    });
  }

  if (game.players.white !== userId && game.players.black !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not a participant of this game',
    });
  }

  setHeader(event, 'Content-Type', 'text/event-stream');
  setHeader(event, 'Cache-Control', 'no-cache');
  setHeader(event, 'Connection', 'keep-alive');

  sseManager.addGameConnection(gameId, userId, event);

  const closeHandler = () => {
    sseManager.removeGameConnection(gameId, userId);
  };

  event.node.req.on('close', closeHandler);

  return new Promise(() => {});
});
