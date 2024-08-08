// features/game-logic/model/pieces/knight.ts

import type { MoveValidationParams } from './types';

export function isValidKnightMove({ game, from, to }: MoveValidationParams): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}
