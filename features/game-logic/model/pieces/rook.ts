// features/game-logic/model/pieces/rook.ts

import type { MoveValidationParams } from '~/server/types/game';

export function isValidRookMove({ game, from, to }: MoveValidationParams): boolean {
  const { board } = game;
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  if (fromRow !== toRow && fromCol !== toCol) {
    return false;
  }

  const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
  const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);

  let currentRow = fromRow + rowStep;
  let currentCol = fromCol + colStep;

  while (currentRow !== toRow || currentCol !== toCol) {
    if (board[currentRow][currentCol] !== null) {
      return false;
    }
    currentRow += rowStep;
    currentCol += colStep;
  }

  return true;
}
