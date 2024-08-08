import type { ChessGame } from '~/entities/game/model/game.model';
import type { PieceColor } from '~/entities/game/model/board.model';
import { isStalemate, isCheckmate } from '../game-logic/check';
import { isDraw } from './draw';

export function isGameOver(game: ChessGame): {
  isOver: boolean;
  result: 'checkmate' | 'stalemate' | 'draw' | 'ongoing';
  winner: PieceColor | null;
} {
  if (isCheckmate(game)) {
    return {
      isOver: true,
      result: 'checkmate',
      winner: game.currentTurn === 'white' ? 'black' : 'white',
    };
  }

  if (isStalemate(game)) {
    return {
      isOver: true,
      result: 'stalemate',
      winner: null,
    };
  }

  if (isDraw(game)) {
    return {
      isOver: true,
      result: 'draw',
      winner: null,
    };
  }

  return {
    isOver: false,
    result: 'ongoing',
    winner: null,
  };
}
