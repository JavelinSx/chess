// entities/game/model/game.model.ts

import type { ChessBoard, PieceColor } from './board.model';
import { initializeBoard } from './board.model';

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export interface ChessGame {
  id: string;
  board: ChessBoard;
  currentTurn: PieceColor;
  players: {
    white: string | null;
    black: string | null;
  };
  status: 'waiting' | 'active' | 'completed';
  winner: PieceColor | null;
  inviterId: string;
  inviteeId: string;
  moveCount: number;
  halfMoveClock: number;
  enPassantTarget: [number, number] | null;
  positions: string[];
  castlingRights: CastlingRights;
}

export function initializeGame(id: string, inviterId: string, inviteeId: string): ChessGame {
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
    moveCount: 0,
    halfMoveClock: 0,
    enPassantTarget: null,
    positions: [],
    castlingRights: {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    },
  };
}
