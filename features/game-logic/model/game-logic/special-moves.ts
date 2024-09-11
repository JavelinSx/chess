import type { Position } from '../pieces/types';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { PieceType, ChessBoard, PieceColor } from '~/entities/game/model/board.model';
import type { ChessPiece } from '~/entities/game/model/board.model';
import { getPieceAt } from './board';

export function simulateCastling(board: ChessBoard, kingSide: boolean, color: 'white' | 'black'): ChessBoard {
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

export function isPawnMove(board: ChessBoard, from: Position): boolean {
  const [row, col] = from;
  const piece = board[row][col];
  return piece?.type === 'pawn';
}

export function isPawnPromotion(board: ChessBoard, from: Position, to: Position): boolean {
  const [fromRow, toRow] = [from[0], to[0]];
  const piece = getPieceAt(board, from);

  if (piece?.type !== 'pawn') return false;

  return (piece.color === 'white' && toRow === 7) || (piece.color === 'black' && toRow === 0);
}

export function isEnPassant(game: ChessGame, from: Position, to: Position): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const piece = getPieceAt(game.board, from);
  return piece?.type === 'pawn' && toCol === game.enPassantTarget?.[1] && Math.abs(fromCol - toCol) === 1;
}

export function isCastling(game: ChessGame, from: Position, to: Position): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const piece = getPieceAt(game.board, from);
  return piece?.type === 'king' && Math.abs(fromCol - toCol) === 2;
}

export function performEnPassant(board: ChessBoard, from: Position, to: Position): ChessBoard {
  const newBoard = board.map((row) => [...row]);
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;
  newBoard[fromRow][toCol] = null; // Remove the captured pawn
  return newBoard;
}

export function performCastling(board: ChessBoard, from: Position, to: Position): ChessBoard {
  const newBoard = board.map((row) => [...row]);
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  // Move the king
  newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;

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

export function promotePawn(game: ChessGame, from: Position, to: Position, promoteTo: PieceType): ChessGame {
  const newBoard = JSON.parse(JSON.stringify(game.board));
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const pawn = newBoard[fromRow][fromCol];

  if (pawn && pawn.type === 'pawn' && (toRow === 0 || toRow === 7)) {
    const newPiece: ChessPiece = { type: promoteTo, color: pawn.color };
    newBoard[toRow][toCol] = newPiece;
    newBoard[fromRow][fromCol] = null;

    const newTurn: PieceColor = game.currentTurn === 'white' ? 'black' : 'white';

    const updatedGame: ChessGame = {
      ...game,
      board: newBoard,
      currentTurn: newTurn,
      moveCount: game.moveCount + 1,
      halfMoveClock: 0,
    };

    return updatedGame;
  } else {
    return game;
  }
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
