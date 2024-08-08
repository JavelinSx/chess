// check.ts

import type { Position } from '../pieces/types';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { PieceColor } from '~/entities/game/model/board.model';
import { isValidMove, getValidMoves } from './moves';
import { findKing, makeMove } from './board';

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
      if (isValidMove({ ...game, currentTurn: oppositeColor }, [row, col], kingPosition)) {
        checkingPieces.push([row, col]);
      }
    }
  }

  return { inCheck: checkingPieces.length > 0, checkingPieces };
}

export function isCheckmate(game: ChessGame): boolean {
  const { inCheck } = isKingInCheck(game);
  if (!inCheck) return false;

  return !hasLegalMoves(game);
}

export function isStalemate(game: ChessGame): boolean {
  console.log('Checking stalemate. Current turn:', game.currentTurn);
  console.log('Board state:', JSON.stringify(game.board, null, 2));

  const { inCheck, checkingPieces } = isKingInCheck(game);
  console.log('Is king in check:', inCheck);
  console.log('Checking pieces:', checkingPieces);

  if (inCheck) {
    console.log('Not stalemate: King is in check');
    return false;
  }

  const hasLegalMove = hasLegalMoves(game);
  console.log('Has legal moves:', hasLegalMove);

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
