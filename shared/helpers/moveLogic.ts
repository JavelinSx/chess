// shared/helpers/moveLogic.ts
import { ISquare, IPiece } from '@/types';
import { isPathClear } from './pathClear';
import { canCastle } from './castlingLogic';

export const pawnLogicMove = (board: ISquare[][], to: ISquare, from: IPiece): boolean => {
  const { x: fromX, y: fromY } = from.position;
  const { x: toX, y: toY } = to.state.position;
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;

  if (from.color === 'white') {
    if (deltaX === 0 && deltaY === 1 && !to.state.type) {
      return true; // Move forward
    } else if (deltaX === 0 && deltaY === 2 && fromY === 1 && !to.state.type && !board[fromY + 1][fromX].state.type) {
      return true; // Initial two-square move
    } else if (Math.abs(deltaX) === 1 && deltaY === 1 && to.state.type) {
      return true; // Capture move
    }
  } else if (from.color === 'black') {
    if (deltaX === 0 && deltaY === -1 && !to.state.type) {
      return true; // Move forward
    } else if (deltaX === 0 && deltaY === -2 && fromY === 6 && !to.state.type && !board[fromY - 1][fromX].state.type) {
      return true; // Initial two-square move
    } else if (Math.abs(deltaX) === 1 && deltaY === -1 && to.state.type) {
      return true; // Capture move
    }
  }
  return false;
};

export const bishopLogicMove = (board: ISquare[][], to: ISquare, from: IPiece): boolean => {
  const { x: fromX, y: fromY } = from.position;
  const { x: toX, y: toY } = to.state.position;

  if (Math.abs(toX - fromX) === Math.abs(toY - fromY) && isPathClear(board, from, to)) {
    return true;
  }
  return false;
};

export const kingLogicMove = (
  board: ISquare[][],
  to: ISquare,
  from: IPiece,
  stateKing: boolean,
  stateTower: boolean,
  stateCheck: boolean
): boolean => {
  const { x: fromX, y: fromY } = from.position;
  const { x: toX, y: toY } = to.state.position;

  if (Math.abs(toX - fromX) <= 1 && Math.abs(toY - fromY) <= 1) {
    return true;
  }

  if (fromY === toY && (toX === fromX + 2 || toX === fromX - 2)) {
    const rookX = toX === fromX + 2 ? 7 : 0;
    const rook = board[fromY][rookX].state.type;
    if (
      rook &&
      rook === 'tower' &&
      canCastle(board, from, board[fromY][rookX].state, stateKing, stateTower, stateCheck)
    ) {
      return true;
    }
  }

  return false;
};

export const horseLogicMove = (board: ISquare[][], to: ISquare, from: IPiece): boolean => {
  const { x: fromX, y: fromY } = from.position;
  const { x: toX, y: toY } = to.state.position;
  const deltaX = Math.abs(toX - fromX);
  const deltaY = Math.abs(toY - fromY);

  if ((deltaX === 2 && deltaY === 1) || (deltaX === 1 && deltaY === 2)) {
    return true;
  }
  return false;
};

export const queenLogicMove = (board: ISquare[][], to: ISquare, from: IPiece): boolean => {
  if ((towerLogicMove(board, to, from) || bishopLogicMove(board, to, from)) && isPathClear(board, from, to)) {
    return true;
  }
  return false;
};

export const towerLogicMove = (board: ISquare[][], to: ISquare, from: IPiece): boolean => {
  const { x: fromX, y: fromY } = from.position;
  const { x: toX, y: toY } = to.state.position;

  if ((fromX === toX || fromY === toY) && isPathClear(board, from, to)) {
    return true;
  }
  return false;
};

export const validLogicMove = (
  board: ISquare[][],
  to: ISquare,
  from: IPiece,
  stateKing: boolean,
  stateTower: boolean,
  stateCheck: boolean
): boolean => {
  const piece = from.type;
  const isValid = (function () {
    switch (piece) {
      case 'pawn':
        return pawnLogicMove(board, to, from);
      case 'bishop':
        return bishopLogicMove(board, to, from);
      case 'king':
        return kingLogicMove(board, to, from, stateKing, stateTower, stateCheck);
      case 'horse':
        return horseLogicMove(board, to, from);
      case 'queen':
        return queenLogicMove(board, to, from);
      case 'tower':
        return towerLogicMove(board, to, from);
      default:
        return false;
    }
  })();
  return isValid;
};
