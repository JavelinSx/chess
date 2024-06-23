import { ISquare, IPiece, IPosition } from '@/types';
import { validLogicMove } from './moveLogic';
import { isInCheck } from './checkCheck';
import { copyBoard } from './copyBoard';

export const getPossibleMoves = (
  board: ISquare[][],
  piece: IPiece,
  stateMoveKing: boolean,
  stateMoveTower: boolean,
  stateCheck: boolean,
  king: IPiece | null
): IPosition[] => {
  const possibleMoves: IPosition[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const targetSquare = board[y][x];
      if (!targetSquare.state.type || targetSquare.state.color !== piece.color) {
        const toSquare = { state: { ...targetSquare.state, position: { x, y } } };
        if (validLogicMove(board, toSquare, piece, stateMoveKing, stateMoveTower, stateCheck)) {
          possibleMoves.push({ x, y });
        }
      }
    }
  }

  if (piece.type === 'king') {
    return filterKingMoves(board, piece, possibleMoves);
  }

  if (stateCheck && king) {
    return filterBlockingMoves(board, piece, possibleMoves, king);
  }

  return possibleMoves;
};

const filterKingMoves = (board: ISquare[][], king: IPiece, possibleMoves: IPosition[]): IPosition[] => {
  return possibleMoves.filter((move) => {
    const tempBoard = copyBoard(board);
    const fromSquare = tempBoard[king.position.y][king.position.x];
    const toSquare = tempBoard[move.y][move.x];

    toSquare.state = { ...fromSquare.state, position: { x: move.x, y: move.y } };
    fromSquare.state = {
      type: null,
      color: null,
      position: { x: fromSquare.state.position.x, y: fromSquare.state.position.y },
    };

    const inCheck = isInCheck(tempBoard, { ...king, position: { x: move.x, y: move.y } });
    return !inCheck.length;
  });
};

const filterBlockingMoves = (
  board: ISquare[][],
  piece: IPiece,
  possibleMoves: IPosition[],
  king: IPiece
): IPosition[] => {
  return possibleMoves.filter((move) => {
    const tempBoard = copyBoard(board);
    const fromSquare = tempBoard[piece.position.y][piece.position.x];
    const toSquare = tempBoard[move.y][move.x];

    toSquare.state = { ...fromSquare.state, position: { x: move.x, y: move.y } };
    fromSquare.state = {
      type: null,
      color: null,
      position: { x: fromSquare.state.position.x, y: fromSquare.state.position.y },
    };

    const inCheck = isInCheck(tempBoard, king);
    return !inCheck.length;
  });
};
