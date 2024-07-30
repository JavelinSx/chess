// features/game-logic/model/pieces/rook.ts

import type { MoveValidationParams } from './types';

export function isValidRookMove({ board, from, to }: MoveValidationParams): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  if (fromRow !== toRow && fromCol !== toCol) {
    return false;
  }

  const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
  const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);

  for (let i = 1; i < Math.max(Math.abs(toRow - fromRow), Math.abs(toCol - fromCol)); i++) {
    if (board[fromRow + i * rowStep][fromCol + i * colStep]) {
      return false;
    }
  }

  return true;
}
