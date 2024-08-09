import type { Position } from '../pieces/types';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { MoveValidationParams } from '../pieces/types';
import { isValidPawnMove } from '../pieces/pawn';
import { isValidRookMove } from '../pieces/rook';
import { isValidKnightMove } from '../pieces/knight';
import { isValidBishopMove } from '../pieces/bishop';
import { isValidQueenMove } from '../pieces/queen';
import { isValidKingMove } from '../pieces/king';
import { getPieceAt, makeMove } from './board';
import { isKingInCheck } from './check';

export function isValidMove(game: ChessGame, from: Position, to: Position): boolean {
  const { board, currentTurn } = game;
  const piece = getPieceAt(board, from);
  const targetPiece = getPieceAt(board, to);

  if (!piece || piece.color !== currentTurn) return false;
  if (targetPiece && targetPiece.color === currentTurn) return false;

  const moveParams: MoveValidationParams = { game, from, to };

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
  }

  return isValid;
}

export function getValidMoves(game: ChessGame, from: Position): Position[] {
  const validMoves: Position[] = [];
  const [fromRow, fromCol] = from;
  const piece = game.board[fromRow][fromCol];
  for (let toRow = 0; toRow < 8; toRow++) {
    for (let toCol = 0; toCol < 8; toCol++) {
      const to: Position = [toRow, toCol];
      if (isValidMove(game, from, to)) {
        const newGame = { ...game, board: makeMove(game.board, from, to) };
        if (!isKingInCheck(newGame).inCheck) {
          validMoves.push(to);
        }
      }
    }
  }
  return validMoves;
}
