// features/game-logic/model/pieces/king.ts
import type { MoveValidationParams } from './types';
import { isKingInCheck } from '../game-logic/check';
import { makeMove } from '../game-logic/board';
import type { ChessBoard, PieceColor } from '~/entities/game/model/board.model';

function simulateCastling(board: ChessBoard, kingSide: boolean, color: 'white' | 'black'): ChessBoard {
  const newBoard = board.map((row) => [...row]);
  const row = color === 'white' ? 0 : 7;

  if (kingSide) {
    newBoard[row][4] = null;
    newBoard[row][5] = { type: 'rook', color };
    newBoard[row][6] = { type: 'king', color };
    newBoard[row][7] = null;
  } else {
    newBoard[row][0] = null;
    newBoard[row][2] = { type: 'king', color };
    newBoard[row][3] = { type: 'rook', color };
    newBoard[row][4] = null;
  }

  return newBoard;
}

export function isValidKingMove({ game, from, to }: MoveValidationParams): boolean {
  const { board, castlingRights, currentTurn: color } = game;
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  console.log(`Checking king move from [${fromRow},${fromCol}] to [${toRow},${toCol}]`);
  console.log(`rowDiff: ${rowDiff}, colDiff: ${colDiff}`);

  // Обычный ход короля (только на одну клетку в любом направлении)
  if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1) || (rowDiff === 1 && colDiff === 1)) {
    const newBoard = makeMove(board, from, to);
    const newGame = { ...game, board: newBoard, currentTurn: color === 'white' ? 'black' : ('white' as PieceColor) };
    const isInCheck = isKingInCheck(newGame).inCheck;
    console.log(`Regular move is valid. King in check after move: ${isInCheck}`);
    return !isInCheck;
  }

  // Рокировка
  if (rowDiff === 0 && colDiff === 2) {
    console.log('Checking castling move');

    const kingSide = toCol > fromCol;
    const castlingRight =
      color === 'white'
        ? kingSide
          ? castlingRights.whiteKingSide
          : castlingRights.whiteQueenSide
        : kingSide
        ? castlingRights.blackKingSide
        : castlingRights.blackQueenSide;

    if (!castlingRight) {
      console.log('Castling is not allowed due to castling rights');
      return false;
    }

    const rookCol = kingSide ? 7 : 0;

    // Проверка наличия ладьи
    const rook = board[fromRow][rookCol];
    if (!rook || rook.type !== 'rook' || rook.color !== color) {
      console.log('Castling is not allowed: no rook in the correct position');
      return false;
    }

    // Проверка пустых клеток
    for (let col = Math.min(fromCol, rookCol) + 1; col < Math.max(fromCol, rookCol); col++) {
      if (board[fromRow][col] !== null) {
        console.log(`Castling path is blocked at [${fromRow},${col}]`);
        return false;
      }
    }

    // Проверка на шах
    if (isKingInCheck(game).inCheck) {
      console.log('Castling is not allowed when king is in check');
      return false;
    }

    // Проверка проходящих через атакованное поле
    const midCol = kingSide ? fromCol + 1 : fromCol - 1;
    const midBoard = makeMove(board, from, [fromRow, midCol]);
    if (isKingInCheck({ ...game, board: midBoard, currentTurn: color }).inCheck) {
      console.log('Castling is not allowed through an attacked square');
      return false;
    }

    // Проверка конечной позиции после рокировки
    const finalBoard = simulateCastling(board, kingSide, color);
    if (isKingInCheck({ ...game, board: finalBoard, currentTurn: color }).inCheck) {
      console.log('Castling is not allowed if it results in check');
      return false;
    }

    console.log('Castling is valid');
    return true;
  }

  console.log('Move is invalid for king');
  return false;

  return false;
}
