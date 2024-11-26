// В файле chess-logic.ts или в отдельном файле game-history.ts

import type { ChessBoard } from '~/server/types/game';

export function updatePositionsHistory(positions: string[], board: ChessBoard): string[] {
  const newPositions = [...positions];
  const boardString = JSON.stringify(board);
  newPositions.push(boardString);
  return newPositions.slice(-10); // Сохраняем только последние 10 позиций
}
