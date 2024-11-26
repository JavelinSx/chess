import type { ChessGame, Position } from '~/server/types/game';
import { isValidMove } from '../game-logic/moves';

export function generateAllMoves(game: ChessGame): [Position, Position][] {
  const moves: [Position, Position][] = [];

  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = game.board[fromRow][fromCol];
      if (piece && piece.color === game.currentTurn) {
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(game, [fromRow, fromCol], [toRow, toCol])) {
              moves.push([
                [fromRow, fromCol],
                [toRow, toCol],
              ]);
            }
          }
        }
      }
    }
  }

  return moves;
}
