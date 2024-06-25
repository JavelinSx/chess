import { IPiece, ISquare, IPosition } from '@/types/chess/types';
import { validLogicMove } from './moveLogic';

export const isInCheck = (board: ISquare[][], king: IPiece): IPosition[] => {
  const opponentColor = king.color === 'white' ? 'black' : 'white';
  const attackCoordinates: IPosition[] = [];

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = board[y][x].state;
      if (piece.color === opponentColor) {
        const toSquare = board[king.position.y][king.position.x];
        if (validLogicMove(board, toSquare, piece, false, false, false)) {
          attackCoordinates.push({ x, y });
        }
      }
    }
  }
  return attackCoordinates;
};
