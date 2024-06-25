import { ISquare, IPiece, IEmptySquare } from '@/types/chess/types';
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

export function initializeBoard(): { board: ISquare[][]; whiteKing: IPiece; blackKing: IPiece } {
  const board = createEmptyBoard();

  const pieces: IPiece[] = [
    // White pieces
    { type: 'horse', color: 'white', position: { x: 1, y: 0 }, icon: horseWhite, blockingMove: false },
    { type: 'tower', color: 'white', position: { x: 0, y: 0 }, icon: towerWhite, blockingMove: false },
    { type: 'bishop', color: 'white', position: { x: 2, y: 0 }, icon: bishopWhite, blockingMove: false },
    { type: 'queen', color: 'white', position: { x: 3, y: 0 }, icon: queenWhite, blockingMove: false },
    { type: 'king', color: 'white', position: { x: 4, y: 0 }, icon: kingWhite, blockingMove: false },
    { type: 'bishop', color: 'white', position: { x: 5, y: 0 }, icon: bishopWhite, blockingMove: false },
    { type: 'horse', color: 'white', position: { x: 6, y: 0 }, icon: horseWhite, blockingMove: false },
    { type: 'tower', color: 'white', position: { x: 7, y: 0 }, icon: towerWhite, blockingMove: false },
    { type: 'pawn', color: 'white', position: { x: 0, y: 1 }, icon: pawnWhite, blockingMove: false },
    { type: 'pawn', color: 'white', position: { x: 1, y: 1 }, icon: pawnWhite, blockingMove: false },
    { type: 'pawn', color: 'white', position: { x: 2, y: 1 }, icon: pawnWhite, blockingMove: false },
    { type: 'pawn', color: 'white', position: { x: 3, y: 1 }, icon: pawnWhite, blockingMove: false },
    { type: 'pawn', color: 'white', position: { x: 4, y: 1 }, icon: pawnWhite, blockingMove: false },
    { type: 'pawn', color: 'white', position: { x: 5, y: 1 }, icon: pawnWhite, blockingMove: false },
    { type: 'pawn', color: 'white', position: { x: 6, y: 1 }, icon: pawnWhite, blockingMove: false },
    { type: 'pawn', color: 'white', position: { x: 7, y: 1 }, icon: pawnWhite, blockingMove: false },

    // Black pieces
    { type: 'tower', color: 'black', position: { x: 0, y: 7 }, icon: towerBlack, blockingMove: false },
    { type: 'horse', color: 'black', position: { x: 1, y: 7 }, icon: horseBlack, blockingMove: false },
    { type: 'bishop', color: 'black', position: { x: 2, y: 7 }, icon: bishopBlack, blockingMove: false },
    { type: 'queen', color: 'black', position: { x: 3, y: 7 }, icon: queenBlack, blockingMove: false },
    { type: 'king', color: 'black', position: { x: 4, y: 7 }, icon: kingBlack, blockingMove: false },
    { type: 'bishop', color: 'black', position: { x: 5, y: 7 }, icon: bishopBlack, blockingMove: false },
    { type: 'horse', color: 'black', position: { x: 6, y: 7 }, icon: horseBlack, blockingMove: false },
    { type: 'tower', color: 'black', position: { x: 7, y: 7 }, icon: towerBlack, blockingMove: false },
    { type: 'pawn', color: 'black', position: { x: 0, y: 6 }, icon: pawnBlack, blockingMove: false },
    { type: 'pawn', color: 'black', position: { x: 1, y: 6 }, icon: pawnBlack, blockingMove: false },
    { type: 'pawn', color: 'black', position: { x: 2, y: 6 }, icon: pawnBlack, blockingMove: false },
    { type: 'pawn', color: 'black', position: { x: 3, y: 6 }, icon: pawnBlack, blockingMove: false },
    { type: 'pawn', color: 'black', position: { x: 4, y: 6 }, icon: pawnBlack, blockingMove: false },
    { type: 'pawn', color: 'black', position: { x: 5, y: 6 }, icon: pawnBlack, blockingMove: false },
    { type: 'pawn', color: 'black', position: { x: 6, y: 6 }, icon: pawnBlack, blockingMove: false },
    { type: 'pawn', color: 'black', position: { x: 7, y: 6 }, icon: pawnBlack, blockingMove: false },
  ];

  let whiteKing: IPiece | null = null;
  let blackKing: IPiece | null = null;

  pieces.forEach((piece) => {
    board[piece.position.y][piece.position.x].state = piece;
    if (piece.type === 'king') {
      if (piece.color === 'white') {
        whiteKing = piece;
      } else {
        blackKing = piece;
      }
    }
  });

  if (!whiteKing || !blackKing) {
    throw new Error('Both kings must be present on the board');
  }

  return { board, whiteKing, blackKing };
}
