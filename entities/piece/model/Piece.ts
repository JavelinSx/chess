export interface IPosition {
  x: number;
  y: number;
}

export interface IPiece {
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
  position: IPosition;
}

export interface ISquare {
  piece: IPiece | null;
  position: IPosition;
}
