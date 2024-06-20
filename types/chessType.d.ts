export interface Board {
  squares: ISquare[];
}
export interface ISquare {
  state: IPiece | IEmptySquare;
}
export interface IEmptySquare {
  type: null;
  color: null;
  position: IPosition;
}
export interface IPiece {
  type: 'pawn' | 'tower' | 'horse' | 'bishop' | 'queen' | 'king' | null;
  color: 'white' | 'black' | null;
  position: IPosition;
  icon: string;
}
export interface IPosition {
  x: number;
  y: number;
}
