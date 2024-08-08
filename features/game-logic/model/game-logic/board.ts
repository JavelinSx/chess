import type { ChessBoard, ChessPiece, PieceColor } from '~/entities/game/model/board.model';
import type { Position } from '../pieces/types';

export function makeMove(board: ChessBoard, from: Position, to: Position): ChessBoard {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[from[0]][from[1]];
  newBoard[to[0]][to[1]] = piece;
  newBoard[from[0]][from[1]] = null;
  return newBoard;
}

export function findKing(board: ChessBoard, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return [row, col];
      }
    }
  }
  return null;
}

export function isCapture(board: ChessBoard, to: Position): boolean {
  const [row, col] = to;
  return board[row][col] !== null;
}

export function getPieceAt(board: ChessBoard, position: Position): ChessPiece | null {
  const [row, col] = position;
  return board[row][col];
}
