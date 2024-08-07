// entities/game/model/board.model.ts

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export type ChessBoard = (ChessPiece | null)[][];

export function initializeBoard(): ChessBoard {
  const board: ChessBoard = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: 'pawn', color: 'white' };
    board[6][i] = { type: 'pawn', color: 'black' };

    board[0][i] = { type: backRow[i], color: 'white' };
    board[7][i] = { type: backRow[i], color: 'black' };
  }

  return board;
}
