import { ISquare, IPiece, IPosition } from '@/types';

export const setBlockingMoves = (board: ISquare[][], blockingMoves: IPosition[], king: IPiece): void => {
  console.log('Установка blockingMove для фигур');
  console.log('blockingMoves:', blockingMoves);
  console.log('king:', king);

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = board[y][x].state;
      if (piece.type) {
        if (piece.color === king.color) {
          const isBlockingMove = blockingMoves.some(
            (move) => move.x === piece.position.x && move.y === piece.position.y
          );
          piece.blockingMove = isBlockingMove;
          console.log(
            `Фигура ${piece.type} (${piece.position.x}, ${piece.position.y}) blockingMove: ${piece.blockingMove}`
          );
        } else {
          piece.blockingMove = false;
        }
      }
    }
  }
};
