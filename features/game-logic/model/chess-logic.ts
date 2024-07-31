// features/game-logic/model/chess-logic.ts

import type { ChessBoard, ChessPiece, PieceColor, PieceType } from '~/entities/game/model/board.model';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { Position } from './pieces/types';
import type { MoveValidationParams } from './pieces/types';
import { isValidPawnMove } from './pieces/pawn';
import { isValidRookMove } from './pieces/rook';
import { isValidKnightMove } from './pieces/knight';
import { isValidBishopMove } from './pieces/bishop';
import { isValidQueenMove } from './pieces/queen';
import { isValidKingMove } from './pieces/king';
import { updateGameState } from './game-state';
export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export interface GameState {
  moveCount: number;
  halfMoveClock: number;
  enPassantTarget: Position | null;
  positions: string[];
  castlingRights: CastlingRights;
  status: 'waiting' | 'active' | 'completed';
  winner: PieceColor | null;
  currentTurn: PieceColor;
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

export function hasLegalMoves(board: ChessBoard, color: PieceColor, gameState: GameState): boolean {
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

export function performMove(
  game: ChessGame,
  from: Position,
  to: Position
): { newBoard: ChessBoard; updatedGame: ChessGame } {
  const gameState: GameState = {
    currentTurn: game.currentTurn,
    moveCount: game.moveCount,
    halfMoveClock: game.halfMoveClock,
    enPassantTarget: game.enPassantTarget,
    positions: game.positions,
    castlingRights: game.castlingRights,
    status: game.status,
    winner: game.winner,
  };

  if (!isValidMove(game.board, from, to, game.currentTurn, gameState)) {
    throw new Error('Invalid move');
  }

  let newBoard = makeMove(game.board, from, to);
  const oppositeColor = game.currentTurn === 'white' ? 'black' : 'white';

  // Handle special moves
  if (isPawnPromotion(newBoard, to)) {
    newBoard = promotePawn(newBoard, to, 'queen'); // Default to queen promotion
  }

  if (isEnPassant(game.board, from, to, gameState.enPassantTarget)) {
    newBoard = performEnPassant(newBoard, from, to);
  }

  if (isCastling(game.board, from, to)) {
    newBoard = performCastling(newBoard, from, to);
  }

  // Update game state
  const updatedGameState = updateGameState(gameState, game.board, from, to, newBoard, oppositeColor);

  const updatedGame: ChessGame = {
    ...game,
    board: newBoard,
    currentTurn: updatedGameState.currentTurn,
    moveCount: updatedGameState.moveCount,
    halfMoveClock: updatedGameState.halfMoveClock,
    enPassantTarget: updatedGameState.enPassantTarget,
    positions: updatedGameState.positions,
    castlingRights: updatedGameState.castlingRights,
    status: updatedGameState.status,
    winner: updatedGameState.winner,
  };

  return { newBoard, updatedGame };
}

export function isPawnPromotion(board: ChessBoard, to: Position): boolean {
  const [row, col] = to;
  const piece = board[row][col];
  return piece?.type === 'pawn' && (row === 0 || row === 7);
}

export function promotePawn(board: ChessBoard, to: Position, promoteTo: PieceType): ChessBoard {
  const newBoard = board.map((row) => [...row]);
  const [row, col] = to;
  const pawn = newBoard[row][col];
  if (pawn && pawn.type === 'pawn') {
    newBoard[row][col] = { ...pawn, type: promoteTo };
  }
  return newBoard;
}

export function isEnPassant(
  board: ChessBoard,
  from: Position,
  to: Position,
  enPassantTarget: Position | null
): boolean {
  if (!enPassantTarget) return false;
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const piece = board[fromRow][fromCol];
  return piece?.type === 'pawn' && toCol === enPassantTarget[1] && Math.abs(fromCol - toCol) === 1;
}

export function performEnPassant(board: ChessBoard, from: Position, to: Position): ChessBoard {
  const newBoard = makeMove(board, from, to);
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  newBoard[fromRow][toCol] = null; // Remove the captured pawn
  return newBoard;
}

export function isCastling(board: ChessBoard, from: Position, to: Position): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const piece = board[fromRow][fromCol];
  return piece?.type === 'king' && Math.abs(fromCol - toCol) === 2;
}

export function performCastling(board: ChessBoard, from: Position, to: Position): ChessBoard {
  const newBoard = makeMove(board, from, to);
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  // Move the rook
  if (toCol > fromCol) {
    // King-side castling
    newBoard[fromRow][toCol - 1] = newBoard[fromRow][7];
    newBoard[fromRow][7] = null;
  } else {
    // Queen-side castling
    newBoard[fromRow][toCol + 1] = newBoard[fromRow][0];
    newBoard[fromRow][0] = null;
  }

  return newBoard;
}

export function isCapture(board: ChessBoard, to: Position): boolean {
  const [row, col] = to;
  return board[row][col] !== null;
}

export function isPawnMove(board: ChessBoard, from: Position): boolean {
  const [row, col] = from;
  return board[row][col]?.type === 'pawn';
}

export function isPawnDoubleMove(board: ChessBoard, from: Position, to: Position): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const piece = board[fromRow][fromCol];
  return piece?.type === 'pawn' && Math.abs(fromRow - toRow) === 2;
}

export function getEnPassantTarget(from: Position, to: Position): Position {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  return [Math.floor((fromRow + toRow) / 2), toCol];
}

export function updatePositionsHistory(positions: string[], board: ChessBoard): string[] {
  const newPositions = [...positions];
  const boardString = JSON.stringify(board);
  newPositions.push(boardString);
  return newPositions.slice(-10); // Keep only the last 10 positions
}

export function updateCastlingRights(
  castlingRights: CastlingRights,
  board: ChessBoard,
  from: Position,
  to: Position
): CastlingRights {
  const newCastlingRights = { ...castlingRights };
  const [fromRow, fromCol] = from;
  const piece = board[fromRow][fromCol];

  if (piece?.type === 'king') {
    if (piece.color === 'white') {
      newCastlingRights.whiteKingSide = false;
      newCastlingRights.whiteQueenSide = false;
    } else {
      newCastlingRights.blackKingSide = false;
      newCastlingRights.blackQueenSide = false;
    }
  } else if (piece?.type === 'rook') {
    if (fromRow === 0 && fromCol === 0) newCastlingRights.whiteQueenSide = false;
    if (fromRow === 0 && fromCol === 7) newCastlingRights.whiteKingSide = false;
    if (fromRow === 7 && fromCol === 0) newCastlingRights.blackQueenSide = false;
    if (fromRow === 7 && fromCol === 7) newCastlingRights.blackKingSide = false;
  }

  return newCastlingRights;
}

export function isDraw(board: ChessBoard, gameState: GameState): boolean {
  // 50-move rule
  if (gameState.halfMoveClock >= 100) return true;

  // Threefold repetition
  const currentPosition = JSON.stringify(board);
  const repetitions = gameState.positions.filter((pos) => pos === currentPosition).length;
  if (repetitions >= 3) return true;

  // Insufficient material
  if (hasInsufficientMaterial(board)) return true;

  return false;
}

export function hasInsufficientMaterial(board: ChessBoard): boolean {
  const pieces = board.flat().filter((piece) => piece !== null);
  if (pieces.length <= 3) {
    const types = new Set(pieces.map((piece) => piece!.type));
    if (types.size === 1 && types.has('king')) return true;
    if (types.size === 2 && (types.has('bishop') || types.has('knight'))) return true;
  }
  return false;
}

export function isValidMove(
  board: ChessBoard,
  from: Position,
  to: Position,
  color: PieceColor,
  gameState: GameState
): boolean {
  const piece = board[from[0]][from[1]];
  if (!piece || piece.color !== color) return false;

  // Проверка, не пытается ли игрок захватить короля
  const targetPiece = board[to[0]][to[1]];
  if (targetPiece && targetPiece.type === 'king') {
    return false;
  }

  const moveParams = { board, from, to, color, gameState };

  switch (piece.type) {
    case 'pawn':
      return isValidPawnMove(moveParams);
    case 'rook':
      return isValidRookMove(moveParams);
    case 'knight':
      return isValidKnightMove(moveParams);
    case 'bishop':
      return isValidBishopMove(moveParams);
    case 'queen':
      return isValidQueenMove(moveParams);
    case 'king':
      return isValidKingMove(moveParams);
    default:
      return false;
  }
}

export function makeMove(board: ChessBoard, from: Position, to: Position): ChessBoard {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[from[0]][from[1]];
  newBoard[to[0]][to[1]] = piece;
  newBoard[from[0]][from[1]] = null;
  return newBoard;
}

// Экспортируем функцию updateGameState из game-state.ts
export { updateGameState } from './game-state';
