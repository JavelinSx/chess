// features/game-logic/model/pieces/king.ts
import type { MoveValidationParams } from './types';
import type { GameState } from '../chess-logic';
import { isKingInCheck } from '../chess-logic';
import { makeMove } from '../chess-logic';

// features/game-logic/model/pieces/king.ts
export function isValidKingMove({ board, from, to, color, gameState }: MoveValidationParams): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  // Обычный ход короля
  if (rowDiff <= 1 && colDiff <= 1) {
    // Проверяем, не будет ли король под шахом после хода
    const newBoard = makeMove(board, from, to);
    if (isKingInCheck(newBoard, color, gameState)) {
      return false;
    }
    return true;
  }

  // Рокировка
  if (rowDiff === 0 && colDiff === 2) {
    const castlingSide = toCol > fromCol ? 'KingSide' : 'QueenSide';
    const castlingRight = `${color}${castlingSide}` as keyof GameState['castlingRights'];

    if (!gameState.castlingRights[castlingRight]) {
      return false;
    }

    const rookCol = toCol > fromCol ? 7 : 0;
    const direction = toCol > fromCol ? 1 : -1;

    // Проверка пустых клеток между королем и ладьей
    for (let col = fromCol + direction; col !== rookCol; col += direction) {
      if (board[fromRow][col] !== null) {
        return false;
      }
    }

    // Проверка, не находится ли король под шахом и не проходит ли через атакованное поле
    if (isKingInCheck(board, color, gameState)) {
      return false;
    }
    for (let col = fromCol; col !== toCol + direction; col += direction) {
      const newBoard = makeMove(board, from, [fromRow, col]);
      if (isKingInCheck(newBoard, color, gameState)) {
        return false;
      }
    }

    return true;
  }

  return false;
}
