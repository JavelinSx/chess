import { ISquare, IPiece, IEmptySquare } from '@/types';
import pawnBlack from '../../shared/chess-img/pawn-black.png';
import pawnWhite from '../../shared/chess-img/pawn-white.png';

import bishopBlack from '../../shared/chess-img/bishop-black.png';
import bishopWhite from '../../shared/chess-img/bishop-white.png';

import horseBlack from '../../shared/chess-img/horse-black.png';
import horseWhite from '../../shared/chess-img/horse-white.png';

import kingBlack from '../../shared/chess-img/king-black.png';
import kingWhite from '../../shared/chess-img/king-white.png';

import queenBlack from '../../shared/chess-img/queen-black.png';
import queenWhite from '../../shared/chess-img/queen-white.png';

import towerWhite from '../../shared/chess-img/tower-white.png';
import towerBlack from '../../shared/chess-img/tower-black.png';
// Function to create an empty board with coordinates for each square
function createEmptyBoard(): ISquare[][] {
  const board: ISquare[][] = [];
  for (let y = 0; y < 8; y++) {
    const row: ISquare[] = [];
    for (let x = 0; x < 8; x++) {
      row.push({
        state: {
          type: null,
          color: null,
          position: {
            x: x,
            y: y,
          },
        } as IEmptySquare,
      });
    }
    board.push(row);
  }
  return board;
}

// Function to set pieces on the board
function setPieces(board: ISquare[][], pieces: IPiece[]): void {
  pieces.forEach((piece) => {
    board[piece.position.y][piece.position.x].state = piece;
  });
}

export function initializeBoard(): ISquare[][] {
  const board = createEmptyBoard();

  const pieces: IPiece[] = [
    // White pieces
    { type: 'horse', color: 'white', position: { x: 1, y: 0 }, icon: horseWhite },
    { type: 'tower', color: 'white', position: { x: 0, y: 0 }, icon: towerWhite },
    { type: 'bishop', color: 'white', position: { x: 2, y: 0 }, icon: bishopWhite },
    { type: 'queen', color: 'white', position: { x: 3, y: 0 }, icon: queenWhite },
    { type: 'king', color: 'white', position: { x: 4, y: 0 }, icon: kingWhite },
    { type: 'bishop', color: 'white', position: { x: 5, y: 0 }, icon: bishopWhite },
    { type: 'horse', color: 'white', position: { x: 6, y: 0 }, icon: horseWhite },
    { type: 'tower', color: 'white', position: { x: 7, y: 0 }, icon: towerWhite },
    { type: 'pawn', color: 'white', position: { x: 0, y: 1 }, icon: pawnWhite },
    { type: 'pawn', color: 'white', position: { x: 1, y: 1 }, icon: pawnWhite },
    { type: 'pawn', color: 'white', position: { x: 2, y: 1 }, icon: pawnWhite },
    { type: 'pawn', color: 'white', position: { x: 3, y: 1 }, icon: pawnWhite },
    { type: 'pawn', color: 'white', position: { x: 4, y: 1 }, icon: pawnWhite },
    { type: 'pawn', color: 'white', position: { x: 5, y: 1 }, icon: pawnWhite },
    { type: 'pawn', color: 'white', position: { x: 6, y: 1 }, icon: pawnWhite },
    { type: 'pawn', color: 'white', position: { x: 7, y: 1 }, icon: pawnWhite },

    // Black pieces
    { type: 'tower', color: 'black', position: { x: 0, y: 7 }, icon: towerBlack },
    { type: 'horse', color: 'black', position: { x: 1, y: 7 }, icon: horseBlack },
    { type: 'bishop', color: 'black', position: { x: 2, y: 7 }, icon: bishopBlack },
    { type: 'queen', color: 'black', position: { x: 3, y: 7 }, icon: queenBlack },
    { type: 'king', color: 'black', position: { x: 4, y: 7 }, icon: kingBlack },
    { type: 'bishop', color: 'black', position: { x: 5, y: 7 }, icon: bishopBlack },
    { type: 'horse', color: 'black', position: { x: 6, y: 7 }, icon: horseBlack },
    { type: 'tower', color: 'black', position: { x: 7, y: 7 }, icon: towerBlack },
    { type: 'pawn', color: 'black', position: { x: 0, y: 6 }, icon: pawnBlack },
    { type: 'pawn', color: 'black', position: { x: 1, y: 6 }, icon: pawnBlack },
    { type: 'pawn', color: 'black', position: { x: 2, y: 6 }, icon: pawnBlack },
    { type: 'pawn', color: 'black', position: { x: 3, y: 6 }, icon: pawnBlack },
    { type: 'pawn', color: 'black', position: { x: 4, y: 6 }, icon: pawnBlack },
    { type: 'pawn', color: 'black', position: { x: 5, y: 6 }, icon: pawnBlack },
    { type: 'pawn', color: 'black', position: { x: 6, y: 6 }, icon: pawnBlack },
    { type: 'pawn', color: 'black', position: { x: 7, y: 6 }, icon: pawnBlack },
  ];

  setPieces(board, pieces);
  return board;
}
