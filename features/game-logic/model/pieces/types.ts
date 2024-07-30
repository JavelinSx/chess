// features/game-logic/model/pieces/types.ts

import type { ChessBoard, PieceColor } from '~/entities/game/model/board.model';

export type Position = [number, number];

export interface MoveValidationParams {
  board: ChessBoard;
  from: Position;
  to: Position;
  color: PieceColor;
}
