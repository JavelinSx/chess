// shared/helpers/getPossibleMoves.ts
import { ISquare, IPiece, IPosition } from '@/types';
import { validLogicMove } from './moveLogic';

export const getPossibleMoves = (
  board: ISquare[][],
  piece: IPiece,
  stateKing: boolean,
  stateTower: boolean,
  stateCheck: boolean
): IPosition[] => {
  const possibleMoves: IPosition[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const targetSquare = board[y][x];
      if (!targetSquare.state.type || targetSquare.state.color !== piece.color) {
        const toSquare = { state: { ...targetSquare.state, position: { x, y } } };
        if (validLogicMove(board, toSquare, piece, stateKing, stateTower, stateCheck)) {
          possibleMoves.push({ x, y });
        }
      }
    }
  }
  return possibleMoves;
};
