// check.ts

import type { Position, ChessGame } from '~/server/types/game';
import { isValidMove, getValidMoves } from './moves';
import { findKing, makeMove } from './board';

// features/game-logic/model/game-logic/check.ts

export function isKingInCheck(game: ChessGame): { inCheck: boolean; checkingPieces: Position[] } {
  const { board, currentTurn } = game;
  const kingPosition = findKing(board, currentTurn);
  const checkingPieces: Position[] = [];

  if (!kingPosition) {
    console.warn(`King not found for ${currentTurn}`);
    return { inCheck: false, checkingPieces: [] };
  }

  const oppositeColor = currentTurn === 'white' ? 'black' : 'white';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === oppositeColor) {
        // Проверяем, может ли фигура атаковать короля
        if (isValidMove({ ...game, currentTurn: oppositeColor }, [row, col], kingPosition)) {
          checkingPieces.push([row, col]);
        }
      }
    }
  }

  return {
    inCheck: checkingPieces.length > 0,
    checkingPieces,
  };
}

export function isCheckmate(game: ChessGame): boolean {
  const { inCheck } = isKingInCheck(game);
  if (!inCheck) return false;

  // Проверяем все возможные ходы текущего игрока
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = game.board[fromRow][fromCol];
      if (piece && piece.color === game.currentTurn) {
        // Проверяем все возможные целевые клетки
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(game, [fromRow, fromCol], [toRow, toCol])) {
              // Пробуем сделать ход и проверяем, останется ли король под шахом
              const newGame = makeMove(game.board, [fromRow, fromCol], [toRow, toCol]);
              if (!isKingInCheck({ ...game, board: newGame }).inCheck) {
                return false; // Есть ход, спасающий от шаха
              }
            }
          }
        }
      }
    }
  }

  return true; // Нет ходов, спасающих от шаха
}

export function isStalemate(game: ChessGame): boolean {
  const { inCheck, checkingPieces } = isKingInCheck(game);

  if (inCheck) {
    return false;
  }

  const hasLegalMove = hasLegalMoves(game);

  return !hasLegalMove;
}

function hasLegalMoves(game: ChessGame): boolean {
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = game.board[fromRow][fromCol];
      if (piece && piece.color === game.currentTurn) {
        const validMoves = getValidMoves(game, [fromRow, fromCol]);
        if (validMoves.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}
