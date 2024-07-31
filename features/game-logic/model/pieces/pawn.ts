// features/game-logic/model/pieces/pawn.ts

import type { MoveValidationParams } from './types';

// features/game-logic/model/pieces/pawn.ts
export function isValidPawnMove({ board, from, to, color, gameState }: MoveValidationParams): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const direction = color === 'white' ? 1 : -1;

  // Обычный ход вперед
  if (fromCol === toCol && toRow === fromRow + direction && board[toRow][toCol] === null) {
    return true;
  }
  if ((color === 'white' && toRow === 7) || (color === 'black' && toRow === 0)) {
    return Math.abs(toCol - fromCol) <= 1; // Разрешаем ход по диагонали для взятия
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
    if (gameState.enPassantTarget && gameState.enPassantTarget[0] === toRow && gameState.enPassantTarget[1] === toCol) {
      return true;
    }
  }

  return false;
}
