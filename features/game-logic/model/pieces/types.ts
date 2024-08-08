// features/game-logic/model/pieces/types.ts

import type { ChessGame } from '~/entities/game/model/game.model';
export type Position = [number, number];

export interface MoveValidationParams {
  game: ChessGame;
  from: Position;
  to: Position;
}
