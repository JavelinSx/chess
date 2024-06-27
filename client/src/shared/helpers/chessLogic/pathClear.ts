// shared/helpers/pathClear.ts
import type { ISquare, IPiece } from '~/types/chess/types';

export const isPathClear = (board: ISquare[][], from: IPiece, to: ISquare): boolean => {
  const { x: fromX, y: fromY } = from.position;
  const { x: toX, y: toY } = to.state.position;

  const deltaX = Math.sign(toX - fromX);
  const deltaY = Math.sign(toY - fromY);

  let x = fromX + deltaX;
  let y = fromY + deltaY;

  while (x !== toX || y !== toY) {
    if (board[y][x].state.type) {
      return false;
    }
    x += deltaX;
    y += deltaY;
  }

  return true;
};
