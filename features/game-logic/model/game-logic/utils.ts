import type { Position, ChessBoard } from '~/server/types/game';

export function isMoveBetween(from: Position, to: Position, pos1: Position, pos2: Position): boolean {
  const [x1, y1] = pos1;
  const [x2, y2] = pos2;
  const [fx, fy] = from;
  const [tx, ty] = to;

  if (
    (x1 === x2 && fx === x1 && tx === x1) || // Вертикальная линия
    (y1 === y2 && fy === y1 && ty === y1) || // Горизонтальная линия
    (Math.abs(x2 - x1) === Math.abs(y2 - y1) && // Диагональная линия
      Math.abs(tx - fx) === Math.abs(ty - fy) &&
      (tx - x1) * (x2 - x1) > 0 &&
      (ty - y1) * (y2 - y1) > 0)
  ) {
    const minX = Math.min(x1, x2),
      maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2),
      maxY = Math.max(y1, y2);
    return tx >= minX && tx <= maxX && ty >= minY && ty <= maxY;
  }

  return false;
}

export function updatePositionsHistory(positions: string[], board: ChessBoard): string[] {
  const newPositions = [...positions];
  const boardString = JSON.stringify(board);
  newPositions.push(boardString);
  return newPositions.slice(-10); // Keep only the last 10 positions
}
