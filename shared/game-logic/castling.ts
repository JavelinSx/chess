import type { CastlingRights, ChessBoard, Position } from '~/server/types/game';

export function updateCastlingRights(
  castlingRights: CastlingRights,
  board: ChessBoard,
  from: Position,
  to: Position
): CastlingRights {
  const [fromRow, fromCol] = from;
  const piece = board[fromRow][fromCol];

  const newCastlingRights = { ...castlingRights };

  if (piece?.type === 'king') {
    if (piece.color === 'white') {
      newCastlingRights.whiteKingSide = false;
      newCastlingRights.whiteQueenSide = false;
    } else {
      newCastlingRights.blackKingSide = false;
      newCastlingRights.blackQueenSide = false;
    }
  } else if (piece?.type === 'rook') {
    if (fromRow === 0 && fromCol === 0) newCastlingRights.whiteQueenSide = false;
    if (fromRow === 0 && fromCol === 7) newCastlingRights.whiteKingSide = false;
    if (fromRow === 7 && fromCol === 0) newCastlingRights.blackQueenSide = false;
    if (fromRow === 7 && fromCol === 7) newCastlingRights.blackKingSide = false;
  }

  return newCastlingRights;
}
