// features/game-logic/model/pieces/pawn.ts

import type { MoveValidationParams } from './types';

export function isValidPawnMove({ board, from, to, color }: MoveValidationParams): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const direction = color === 'white' ? 1 : -1;

  // Ход на одну клетку вперед
  if (fromCol === toCol && toRow === fromRow + direction && !board[toRow][toCol]) {
    return true;
  }

  // Ход на две клетки вперед с начальной позиции
  if (
    fromCol === toCol &&
    ((color === 'white' && fromRow === 1 && toRow === 3) || (color === 'black' && fromRow === 6 && toRow === 4)) &&
    !board[fromRow + direction][fromCol] &&
    !board[toRow][toCol]
  ) {
    return true;
  }

  // Взятие по диагонали
  if (
    Math.abs(toCol - fromCol) === 1 &&
    toRow === fromRow + direction &&
    board[toRow][toCol] &&
    board[toRow][toCol]!.color !== color
  ) {
    return true;
  }

  // TODO: Добавить проверку на взятие на проходе

  return false;
}
