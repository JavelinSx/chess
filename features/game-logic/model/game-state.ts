// features/game-logic/model/game-state.ts

import type { ChessBoard, PieceColor } from '~/entities/game/model/board.model';
import type { Position } from './pieces/types';
import type { GameState, CastlingRights } from './chess-logic';
import {
  isValidMove,
  makeMove,
  isCapture,
  isPawnMove,
  isPawnDoubleMove,
  getEnPassantTarget,
  updateCastlingRights,
  updatePositionsHistory,
  isDraw,
} from './chess-logic';

export function isCheckmate(board: ChessBoard, color: PieceColor, gameState: GameState): boolean {
  if (!isKingInCheck(board, color, gameState)) return false;

  return !hasLegalMoves(board, color, gameState);
}

export function isStalemate(board: ChessBoard, color: PieceColor, gameState: GameState): boolean {
  if (isKingInCheck(board, color, gameState)) return false;

  return !hasLegalMoves(board, color, gameState);
}

function hasLegalMoves(board: ChessBoard, color: PieceColor, gameState: GameState): boolean {
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.color === color) {
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(board, [fromRow, fromCol], [toRow, toCol], color, gameState)) {
              const newBoard = makeMove(board, [fromRow, fromCol], [toRow, toCol]);
              if (!isKingInCheck(newBoard, color, gameState)) {
                return true;
              }
            }
          }
        }
      }
    }
  }
  return false;
}

export function generateAllMoves(board: ChessBoard, color: PieceColor, gameState: GameState): [Position, Position][] {
  const moves: [Position, Position][] = [];

  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.color === color) {
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(board, [fromRow, fromCol], [toRow, toCol], color, gameState)) {
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

export function updateGameState(
  gameState: GameState,
  board: ChessBoard,
  from: Position,
  to: Position,
  newBoard: ChessBoard,
  nextTurn: PieceColor
): GameState {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const movingPiece = board[fromRow][fromCol];

  const newGameState: GameState = {
    ...gameState,
    moveCount: gameState.moveCount + 1,
    halfMoveClock: isCapture(board, to) || isPawnMove(board, from) ? 0 : gameState.halfMoveClock + 1,
    enPassantTarget: isPawnDoubleMove(board, from, to) ? getEnPassantTarget(from, to) : null,
    castlingRights: updateCastlingRights(gameState.castlingRights, board, from, to),
    currentTurn: nextTurn,
    positions: updatePositionsHistory(gameState.positions, newBoard),
  };

  // Обновляем статус игры и победителя
  if (isCheckmate(newBoard, nextTurn, newGameState)) {
    newGameState.status = 'completed';
    newGameState.winner = gameState.currentTurn;
  } else if (isStalemate(newBoard, nextTurn, newGameState)) {
    newGameState.status = 'completed';
    newGameState.winner = null;
  } else if (isDraw(newBoard, newGameState)) {
    newGameState.status = 'completed';
    newGameState.winner = null;
  } else {
    newGameState.status = 'active';
    newGameState.winner = null;
  }

  return newGameState;
}

export function isKingInCheck(board: ChessBoard, color: PieceColor, gameState: GameState): boolean {
  const kingPosition = findKing(board, color);
  if (!kingPosition) return false;

  const oppositeColor = color === 'white' ? 'black' : 'white';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === oppositeColor) {
        if (isValidMove(board, [row, col], kingPosition, oppositeColor, gameState)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function findKing(board: ChessBoard, color: PieceColor): Position | null {
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

// Функция для проверки окончания игры
export function isGameOver(
  board: ChessBoard,
  currentTurn: PieceColor,
  gameState: GameState
): {
  isOver: boolean;
  result: 'checkmate' | 'stalemate' | 'draw' | 'ongoing';
  winner: PieceColor | null;
} {
  if (isCheckmate(board, currentTurn, gameState)) {
    return {
      isOver: true,
      result: 'checkmate',
      winner: currentTurn === 'white' ? 'black' : 'white',
    };
  }

  if (isStalemate(board, currentTurn, gameState)) {
    return {
      isOver: true,
      result: 'stalemate',
      winner: null,
    };
  }

  if (isDraw(board, gameState)) {
    return {
      isOver: true,
      result: 'draw',
      winner: null,
    };
  }

  return {
    isOver: false,
    result: 'ongoing',
    winner: null,
  };
}
