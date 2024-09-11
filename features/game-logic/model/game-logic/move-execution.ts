import type { ChessGame } from '~/entities/game/model/game.model';
import type { Position } from '../pieces/types';
import { makeMove, isCapture, getPieceAt } from './board';
import { isKingInCheck, isCheckmate, isStalemate } from './check';
import { isPawnPromotion, isEnPassant, isCastling, performEnPassant, performCastling } from './special-moves';
import { isPawnDoubleMove, getEnPassantTarget } from '../pieces/pawn';
import { updatePositionsHistory } from './utils';

export function performMove(game: ChessGame, from: Position, to: Position): ChessGame {
  let newBoard = makeMove(game.board, from, to);
  const oppositeColor = game.currentTurn === 'white' ? 'black' : 'white';

  // Handle special moves
  if (isPawnPromotion(newBoard, from, to)) {
    return {
      ...game,
      board: newBoard,
    };
  } else if (isEnPassant(game, from, to)) {
    newBoard = performEnPassant(game.board, from, to);
  } else if (isCastling(game, from, to)) {
    newBoard = performCastling(game.board, from, to);
  }

  // Update captured pieces
  const capturedPiece = getPieceAt(game.board, to);
  const newCapturedPieces = { ...game.capturedPieces };
  if (capturedPiece) {
    newCapturedPieces[game.currentTurn] = [...newCapturedPieces[game.currentTurn], capturedPiece.type];
  }

  // Create new game state
  const newGame: ChessGame = {
    ...game,
    board: newBoard,
    currentTurn: oppositeColor,
    moveCount: game.moveCount + 1,
    halfMoveClock:
      isCapture(game.board, to) || game.board[from[0]][from[1]]?.type === 'pawn' ? 0 : game.halfMoveClock + 1,
    enPassantTarget: isPawnDoubleMove(from, to) ? getEnPassantTarget(from, to) : null,
    positions: updatePositionsHistory(game.positions, newBoard),
    capturedPieces: newCapturedPieces,
  };

  // Check for check, checkmate, or stalemate
  const { inCheck, checkingPieces } = isKingInCheck(newGame);
  newGame.isCheck = inCheck;
  newGame.checkingPieces = checkingPieces;
  newGame.isCheckmate = isCheckmate(newGame);
  newGame.isStalemate = !newGame.isCheckmate && isStalemate(newGame);

  if (newGame.isCheckmate || newGame.isStalemate) {
    newGame.status = 'completed';
    newGame.winner = newGame.isCheckmate ? game.currentTurn : null;
  }

  return newGame;
}
