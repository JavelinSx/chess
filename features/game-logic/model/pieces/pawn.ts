// features/game-logic/model/pieces/pawn.ts

import type { MoveValidationParams, Position } from '~/server/types/game';

export function isValidPawnMove({ game, from, to }: MoveValidationParams): boolean {
  const { board, currentTurn: color, enPassantTarget } = game;
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const direction = color === 'white' ? 1 : -1;

  // Обычный ход вперед
  if (fromCol === toCol && toRow === fromRow + direction && board[toRow][toCol] === null) {
    return true;
  }

  // Ход на две клетки вперед с начальной позиции
  if (
    fromCol === toCol &&
    ((color === 'white' && fromRow === 1 && toRow === 3) || (color === 'black' && fromRow === 6 && toRow === 4)) &&
    board[fromRow + direction][fromCol] === null &&
    board[toRow][toCol] === null
  ) {
    return true;
  }

  // Взятие по диагонали
  if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction) {
    if (board[toRow][toCol] !== null && board[toRow][toCol]?.color !== color) {
      return true;
    }

    // En Passant
    if (enPassantTarget && enPassantTarget[0] === toRow && enPassantTarget[1] === toCol) {
      return true;
    }
  }

  return false;
}

export function isPawnDoubleMove(from: Position, to: Position): boolean {
  const [fromRow, toRow] = from;
  return Math.abs(toRow - fromRow) === 2;
}

export function getEnPassantTarget(from: Position, to: Position): Position {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  return [Math.floor((fromRow + toRow) / 2), toCol];
}
