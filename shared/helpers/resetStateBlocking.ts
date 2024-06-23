import { ISquare } from '@/types';

export const resetStates = (board: ISquare[][]): void => {
  console.log('Сброс состояния blockingMove для всех фигур');

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = board[y][x].state;
      if (piece.type) {
        piece.blockingMove = false;
        console.log(
          `Фигура ${piece.type} (${piece.position.x}, ${piece.position.y}) blockingMove: ${piece.blockingMove}`
        );
      }
    }
  }
};
