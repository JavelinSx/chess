import { ISquare, IPiece } from '@/types';

// Utility function to check if a path is clear
const isPathClear = (board: ISquare[][], from: IPiece, to: ISquare): boolean => {
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

const pawnLogicMove = (board: ISquare[][], to: ISquare, from: IPiece): boolean => {
  const { x: fromX, y: fromY } = from.position;
  const { x: toX, y: toY } = to.state.position;
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;

  // Pawn move logic: forward movement depends on color
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

const bishopLogicMove = (board: ISquare[][], to: ISquare, from: IPiece): boolean => {
  const { x: fromX, y: fromY } = from.position;
  const { x: toX, y: toY } = to.state.position;

  if (Math.abs(toX - fromX) === Math.abs(toY - fromY) && isPathClear(board, from, to)) {
    return true;
  }
  return false;
};

const kingLogicMove = (board: ISquare[][], to: ISquare, from: IPiece): boolean => {
  const { x: fromX, y: fromY } = from.position;
  const { x: toX, y: toY } = to.state.position;

  if (Math.abs(toX - fromX) <= 1 && Math.abs(toY - fromY) <= 1) {
    return true;
  }
  return false;
};

const horseLogicMove = (board: ISquare[][], to: ISquare, from: IPiece): boolean => {
  const { x: fromX, y: fromY } = from.position;
  const { x: toX, y: toY } = to.state.position;
  const deltaX = Math.abs(toX - fromX);
  const deltaY = Math.abs(toY - fromY);

  if ((deltaX === 2 && deltaY === 1) || (deltaX === 1 && deltaY === 2)) {
    return true;
  }
  return false;
};

const queenLogicMove = (board: ISquare[][], to: ISquare, from: IPiece): boolean => {
  if ((towerLogicMove(board, to, from) || bishopLogicMove(board, to, from)) && isPathClear(board, from, to)) {
    return true;
  }
  return false;
};

const towerLogicMove = (board: ISquare[][], to: ISquare, from: IPiece): boolean => {
  const { x: fromX, y: fromY } = from.position;
  const { x: toX, y: toY } = to.state.position;

  if ((fromX === toX || fromY === toY) && isPathClear(board, from, to)) {
    return true;
  }
  return false;
};

export const validLogicMove = (board: ISquare[][], to: ISquare, from: IPiece): boolean => {
  const piece = from.type;
  switch (piece) {
    case 'pawn':
      return pawnLogicMove(board, to, from);
    case 'bishop':
      return bishopLogicMove(board, to, from);
    case 'king':
      return kingLogicMove(board, to, from);
    case 'horse':
      return horseLogicMove(board, to, from);
    case 'queen':
      return queenLogicMove(board, to, from);
    case 'tower':
      return towerLogicMove(board, to, from);
    default:
      return false;
  }
};
