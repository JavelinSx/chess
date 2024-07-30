// features/game-logic/model/game-state.ts

import type { ChessBoard, ChessPiece, PieceColor, PieceType } from '~/entities/game/model/board.model';
import type { Position } from './pieces/types';
import { isValidMove, makeMove } from './chess-logic';

// Функция для поиска позиции короля на доске
function findKing(board: ChessBoard, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return [row, col];
      }
    }
  }
  return null;
}

// Функция для проверки, находится ли король под шахом
export function isInCheck(board: ChessBoard, color: PieceColor): boolean {
  const kingPosition = findKing(board, color);
  if (!kingPosition) return false;

  const oppositeColor: PieceColor = color === 'white' ? 'black' : 'white';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === oppositeColor) {
        if (isValidMove(board, [row, col], kingPosition, oppositeColor)) {
          return true;
        }
      }
    }
  }

  return false;
}

// Функция для генерации всех возможных ходов для данной позиции
export function generateAllMoves(board: ChessBoard, color: PieceColor): [Position, Position][] {
  const moves: [Position, Position][] = [];

  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.color === color) {
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(board, [fromRow, fromCol], [toRow, toCol], color)) {
              moves.push([
                [fromRow, fromCol],
                [toRow, toCol],
              ]);
            }
          }
        }
      }
    }
  }

  return moves;
}

// Функция для проверки мата
export function isCheckmate(board: ChessBoard, color: PieceColor): boolean {
  if (!isInCheck(board, color)) return false;

  const allMoves = generateAllMoves(board, color);

  for (const [from, to] of allMoves) {
    const newBoard = makeMove(board, from, to);
    if (!isInCheck(newBoard, color)) {
      return false;
    }
  }

  return true;
}

// Функция для проверки пата
export function isStalemate(board: ChessBoard, color: PieceColor): boolean {
  if (isInCheck(board, color)) return false;

  const allMoves = generateAllMoves(board, color);

  if (allMoves.length === 0) {
    return true;
  }

  for (const [from, to] of allMoves) {
    const newBoard = makeMove(board, from, to);
    if (!isInCheck(newBoard, color)) {
      return false;
    }
  }

  return true;
}

// Функция для проверки окончания игры
export function isGameOver(
  board: ChessBoard,
  currentTurn: PieceColor
): {
  isOver: boolean;
  result: 'checkmate' | 'stalemate' | 'ongoing';
  winner: PieceColor | null;
} {
  if (isCheckmate(board, currentTurn)) {
    return {
      isOver: true,
      result: 'checkmate',
      winner: currentTurn === 'white' ? 'black' : 'white',
    };
  }

  if (isStalemate(board, currentTurn)) {
    return {
      isOver: true,
      result: 'stalemate',
      winner: null,
    };
  }

  return {
    isOver: false,
    result: 'ongoing',
    winner: null,
  };
}
