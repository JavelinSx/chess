import { hasInsufficientMaterial } from '../game-logic/special-moves';
import type { ChessGame } from '~/entities/game/model/game.model';
export function isDraw(game: ChessGame): boolean {
  // 50-move rule
  if (game.halfMoveClock >= 100) return true;

  // Threefold repetition
  const currentPosition = JSON.stringify(game.board);
  const repetitions = game.positions.filter((pos) => pos === currentPosition).length;
  if (repetitions >= 3) return true;

  // Insufficient material
  if (hasInsufficientMaterial(game.board)) return true;

  return false;
}
