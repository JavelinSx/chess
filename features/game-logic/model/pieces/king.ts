// features/game-logic/model/pieces/king.ts

import type { MoveValidationParams } from './types';

export function isValidKingMove({ from, to }: MoveValidationParams): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  // Обычный ход короля
  if (rowDiff <= 1 && colDiff <= 1) {
    return true;
  }

  // TODO: Добавить проверку на рокировку

  return false;
}
