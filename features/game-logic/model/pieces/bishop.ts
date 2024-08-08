// features/game-logic/model/pieces/bishop.ts

import type { MoveValidationParams } from './types';

export function isValidBishopMove({ game, from, to }: MoveValidationParams): boolean {
  const { board } = game;
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) {
    return false;
  }

  const rowStep = (toRow - fromRow) / Math.abs(toRow - fromRow);
  const colStep = (toCol - fromCol) / Math.abs(toCol - fromCol);

  for (let i = 1; i < Math.abs(toRow - fromRow); i++) {
    if (board[fromRow + i * rowStep][fromCol + i * colStep]) {
      return false;
    }
  }

  return true;
}
