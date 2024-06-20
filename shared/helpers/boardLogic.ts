import { IPiece, ISquare } from '@/types';

export const isSameColor = (selectPiece: IPiece, dropPiece: ISquare): boolean => {
  if (selectPiece.type && dropPiece.state.type) {
    return selectPiece.color === dropPiece.state.color;
  }
  return false;
};
export const isSameSquare = (selectPiece: IPiece, dropPiece: ISquare): boolean => {
  return selectPiece.position.x === dropPiece.state.position.x && selectPiece.position.y === dropPiece.state.position.y;
};
