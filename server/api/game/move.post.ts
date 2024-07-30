// server/api/game/move.post.ts

import type { ChessGame } from '~/entities/game/model/game.model';
import { performMove } from '~/features/game-logic/model/chess-logic';
import { broadcastGameUpdate } from '~/server/api/sse/game-moves';

export default defineEventHandler(async (event) => {
  const { gameId, from, to } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!gameId || !from || !to || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body',
    });
  }

  // Получаем игру из базы данных
  const game = await getGameFromDatabase(gameId);

  if (!game) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Game not found',
    });
  }

  // Проверяем, что ход делает правильный игрок
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
    const { newBoard, gameState } = performMove(game.board, from, to, game.currentTurn);

    // Обновляем состояние игры
    game.board = newBoard;
    game.currentTurn = game.currentTurn === 'white' ? 'black' : 'white';
    game.status = gameState.isOver ? 'completed' : 'active';
    game.winner = gameState.winner;

    // Сохраняем обновленное состояние игры в базу данных
    await saveGameToDatabase(game);

    // Отправляем обновление всем подключенным клиентам
    await broadcastGameUpdate(gameId, game);

    return { success: true, game };
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Invalid move',
    });
  }
});

// Эти функции нужно реализовать для работы с вашей базой данных
async function getGameFromDatabase(gameId: string): Promise<ChessGame | null> {
  return null;
  // TODO: Реализовать получение игры из базы данных
}

async function saveGameToDatabase(game: ChessGame): Promise<void> {
  // TODO: Реализовать сохранение игры в базу данных
}
