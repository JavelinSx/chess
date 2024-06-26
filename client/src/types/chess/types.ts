export type PieceType = 'pawn' | 'bishop' | 'king' | 'horse' | 'queen' | 'tower';
export type PieceColor = 'white' | 'black';

export interface IPosition {
  x: number;
  y: number;
}

export interface IEmptySquare {
  type: null;
  color: null;
  position: IPosition;
}

export interface IPiece {
  type: PieceType;
  color: PieceColor;
  position: IPosition;
  icon?: string;
  blockingMove?: boolean;
}

export interface ISquare {
  state: IPiece | IEmptySquare;
}

export interface Board {
  squares: ISquare[];
}
