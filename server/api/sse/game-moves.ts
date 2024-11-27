// server/api/sse/game-moves.ts
import { GameService } from '~/server/services/game.service';
import { gameSSEManager } from '~/server/utils/sseManager/GameSSEManager';

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

  const gameResponse = await GameService.getGame(gameId);

  if (!gameResponse.data) {
    throw createError({
      statusCode: 404,
      statusMessage: gameResponse.error || 'Game not found',
    });
  }

  const game = gameResponse.data;

  if (!game.players || typeof game.players.white === 'undefined' || typeof game.players.black === 'undefined') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Invalid game data: players information is missing',
    });
  }

  if (game.players.white?._id.toString() !== userId && game.players.black?._id.toString() !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not a participant of this game',
    });
  }

  setHeader(event, 'Content-Type', 'text/event-stream');
  setHeader(event, 'Cache-Control', 'no-cache');
  setHeader(event, 'Connection', 'keep-alive');

  gameSSEManager.addGameConnection(gameId, userId, event);

  const closeHandler = () => {
    gameSSEManager.removeGameConnection(gameId, userId);
  };

  event.node.req.on('close', closeHandler);
  setInterval(() => {
    event.node.res.write(':\n\n');
  }, 10000);
  return new Promise(() => {});
});
