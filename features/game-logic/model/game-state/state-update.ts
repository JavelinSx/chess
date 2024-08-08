import type { ChessBoard, PieceColor } from '~/entities/game/model/board.model';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { Position } from '../pieces/types';
import { updateCastlingRights } from '../game-logic/castling';
import { updatePositionsHistory } from '../game-logic/utils';
import { isCapture } from '../game-logic/board';
import { isPawnDoubleMove, getEnPassantTarget } from '../pieces/pawn';
import { isKingInCheck } from '../game-logic/check';
import { isStalemate, isCheckmate } from '../game-logic/check';
import { isDraw } from './draw';

export function updateGameState(
  game: ChessGame,
  from: Position,
  to: Position,
  newBoard: ChessBoard,
  nextTurn: PieceColor
): ChessGame {
  const updatedGame: ChessGame = {
    ...game,
    board: newBoard,
    currentTurn: nextTurn,
    moveCount: game.moveCount + 1,
    halfMoveClock:
      isCapture(game.board, to) || game.board[from[0]][from[1]]?.type === 'pawn' ? 0 : game.halfMoveClock + 1,
    enPassantTarget: isPawnDoubleMove(from, to) ? getEnPassantTarget(from, to) : null,
    positions: updatePositionsHistory(game.positions, newBoard),
    castlingRights: updateCastlingRights(game.castlingRights, game.board, from, to),
  };

  const { inCheck, checkingPieces } = isKingInCheck(updatedGame);
  updatedGame.isCheck = inCheck;
  updatedGame.checkingPieces = checkingPieces;

  // Обновляем статус игры и победителя
  if (isCheckmate(updatedGame)) {
    updatedGame.status = 'completed';
    updatedGame.winner = game.currentTurn;
    updatedGame.isCheckmate = true;
  } else if (isStalemate(updatedGame)) {
    updatedGame.status = 'completed';
    updatedGame.winner = null;
    updatedGame.isStalemate = true;
  } else if (isDraw(updatedGame)) {
    updatedGame.status = 'completed';
    updatedGame.winner = null;
  } else {
    updatedGame.status = 'active';
    updatedGame.winner = null;
    updatedGame.isCheckmate = false;
    updatedGame.isStalemate = false;
  }

  return updatedGame;
}
