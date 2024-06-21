// shared/helpers/castlingLogic.ts
import { ISquare, IPiece } from '@/types';
import { isPathClear } from './pathClear';

export const canCastle = (
  board: ISquare[][],
  king: IPiece,
  rook: IPiece,
  stateKing: boolean,
  stateTower: boolean,
  stateCheck: boolean
): boolean => {
  if (stateKing || stateTower || stateCheck) {
    return false;
  }
  const kingY = king.position.y;
  const rookX = rook.position.x;
  const deltaX = Math.sign(rookX - king.position.x);

  for (let x = king.position.x + deltaX; x !== rookX; x += deltaX) {
    if (board[kingY][x].state.type) {
      return false;
    }
  }

  return true;
};

export const executeCastling = (board: ISquare[][], king: IPiece, rook: IPiece): void => {
  const kingY = king.position.y;
  const rookX = rook.position.x;
  const rookToX = rookX === 7 ? 5 : 3;

  // Перемещение короля
  board[kingY][rookToX - 1].state = { ...king, position: { x: rookToX - 1, y: kingY } };
  board[kingY][king.position.x].state = { type: null, color: null, position: { x: king.position.x, y: kingY } };

  // Перемещение ладьи
  board[kingY][rookToX].state = { ...rook, position: { x: rookToX, y: kingY } };
  board[kingY][rookX].state = { type: null, color: null, position: { x: rookX, y: kingY } };
};
