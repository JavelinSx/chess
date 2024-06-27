import type { ISquare } from '~/types/chess/types';

export const resetStates = (board: ISquare[][]): void => {
  console.log('Сброс состояния blockingMove для всех фигур');

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = board[y][x].state;
      if (piece.type) {
        piece.blockingMove = false;
      }
    }
  }
};
