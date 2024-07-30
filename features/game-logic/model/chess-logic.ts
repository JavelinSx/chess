// features/game-logic/model/chess-logic.ts

import type { ChessBoard, ChessPiece, PieceColor, PieceType } from '~/entities/game/model/board.model';
import type { Position } from './pieces/types';
import { isValidPawnMove } from './pieces/pawn';
import { isValidRookMove } from './pieces/rook';
import { isValidKnightMove } from './pieces/knight';
import { isValidBishopMove } from './pieces/bishop';
import { isValidQueenMove } from './pieces/queen';
import { isValidKingMove } from './pieces/king';
import { isInCheck, isGameOver } from './game-state';

export function isValidMove(board: ChessBoard, from: Position, to: Position, currentTurn: PieceColor): boolean {
  const piece = board[from[0]][from[1]];
  if (!piece || piece.color !== currentTurn) return false;

  const moveParams = { board, from, to, color: piece.color };

  let isValid = false;

  switch (piece.type) {
    case 'pawn':
      isValid = isValidPawnMove(moveParams);
      break;
    case 'rook':
      isValid = isValidRookMove(moveParams);
      break;
    case 'knight':
      isValid = isValidKnightMove(moveParams);
      break;
    case 'bishop':
      isValid = isValidBishopMove(moveParams);
      break;
    case 'queen':
      isValid = isValidQueenMove(moveParams);
      break;
    case 'king':
      isValid = isValidKingMove(moveParams);
      break;
    default:
      return false;
  }

  if (isValid) {
    // Проверяем, не оставляет ли этот ход короля под шахом
    const newBoard = makeMove(board, from, to);
    if (isInCheck(newBoard, currentTurn)) {
      return false;
    }
  }

  return isValid;
}

export function makeMove(board: ChessBoard, from: Position, to: Position): ChessBoard {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[from[0]][from[1]];
  newBoard[to[0]][to[1]] = piece;
  newBoard[from[0]][from[1]] = null;
  return newBoard;
}

export function performMove(
  board: ChessBoard,
  from: Position,
  to: Position,
  currentTurn: PieceColor
): { newBoard: ChessBoard; gameState: ReturnType<typeof isGameOver> } {
  if (!isValidMove(board, from, to, currentTurn)) {
    throw new Error('Invalid move');
  }

  const newBoard = makeMove(board, from, to);
  const nextTurn = currentTurn === 'white' ? 'black' : 'white';
  const gameState = isGameOver(newBoard, nextTurn);

  return { newBoard, gameState };
}

// Добавьте другие вспомогательные функции по мере необходимости
