// features/game-logic/model/pieces/queen.ts

import type { MoveValidationParams } from './types';
import { isValidRookMove } from './rook';
import { isValidBishopMove } from './bishop';

export function isValidQueenMove(params: MoveValidationParams): boolean {
  return isValidRookMove(params) || isValidBishopMove(params);
}
