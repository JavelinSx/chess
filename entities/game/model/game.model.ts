// entities/game/model/game.model.ts

import type { ChessBoard, PieceColor } from './board.model';
import { initializeBoard } from './board.model';

export interface ChessGame {
  id: string;
  board: ChessBoard;
  currentTurn: PieceColor;
  players: {
    white: string | null;
    black: string | null;
  };
  status: 'waiting' | 'active' | 'completed';
  winner: string | null;
  inviterId: string;
  inviteeId: string | null;
}

export function initializeGame(id: string, inviterId: string, inviteeId: string | null): ChessGame {
  return {
    id,
    board: initializeBoard(),
    currentTurn: 'white',
    players: {
      white: null,
      black: null,
    },
    status: 'waiting',
    winner: null,
    inviterId,
    inviteeId,
  };
}
