// server/api/sse/game-moves.ts

import { H3Event } from 'h3';
import { getGameFromDatabase } from '~/server/services/game.service';
import type { ChessGame } from '~/entities/game/model/game.model';

const gameClients = new Map<string, Map<string, H3Event>>();

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

  if (!gameClients.has(gameId)) {
    gameClients.set(gameId, new Map());
  }
  gameClients.get(gameId)!.set(userId, event);

  const closeHandler = () => {
    gameClients.get(gameId)?.delete(userId);
    if (gameClients.get(gameId)?.size === 0) {
      gameClients.delete(gameId);
    }
  };

  event.node.req.on('close', closeHandler);

  return new Promise(() => {});
});

export async function broadcastGameUpdate(gameId: string, game: ChessGame) {
  const clients = gameClients.get(gameId);
  if (clients) {
    const message = JSON.stringify({ type: 'game_update', game });
    for (const [, clientEvent] of clients) {
      await sendEvent(clientEvent, message);
    }
  }
}

async function sendEvent(event: H3Event, data: string) {
  await event.node.res.write(`data: ${data}\n\n`);
}
