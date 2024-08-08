import { describe, it, expect, beforeEach } from 'vitest';
import { performMove } from '~/features/game-logic/model/game-logic/move-execution';
import { isValidMove } from '~/features/game-logic/model/game-logic/moves';
import { isKingInCheck } from '~/features/game-logic/model/game-logic/check';
import { isDraw } from '~/features/game-logic/model/game-state/draw';
import { makeMove, isCapture } from '~/features/game-logic/model/game-logic/board';
import { isPawnMove, hasInsufficientMaterial } from '~/features/game-logic/model/game-logic/special-moves';
import { isPawnDoubleMove, getEnPassantTarget } from '~/features/game-logic/model/pieces/pawn';
import { updateCastlingRights } from '~/features/game-logic/model/game-logic/castling';
import { updatePositionsHistory } from '~/features/game-logic/model/game-logic/utils';
import { isCheckmate, isStalemate } from '~/features/game-logic/model/game-logic/check';
import { generateAllMoves } from '~/features/game-logic/model/game-state/move-generation';

import type { ChessGame } from '../entities/game/model/game.model';
import type { ChessBoard, ChessPiece } from '~/entities/game/model/board.model';
import type { Position } from '~/features/game-logic/model/pieces/types';
import { initializeGame } from '../entities/game/model/game.model';

function createEmptyBoard(): ChessBoard {
  return Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
}

function setupTestBoard(pieces: { position: [number, number]; piece: ChessPiece }[]): ChessBoard {
  const board = createEmptyBoard();
  pieces.forEach(({ position, piece }) => {
    const [row, col] = position;
    board[row][col] = piece;
  });
  return board;
}

function createTestGame(
  pieces: { position: [number, number]; piece: ChessPiece }[],
  currentTurn: 'white' | 'black' = 'white'
): ChessGame {
  const game = initializeGame('testGame', 'player1', 'player2');
  game.board = setupTestBoard(pieces);
  game.currentTurn = currentTurn;
  game.castlingRights = {
    whiteKingSide: true,
    whiteQueenSide: true,
    blackKingSide: true,
    blackQueenSide: true,
  };
  return game;
}

describe('Chess Logic', () => {
  describe('Piece Movement', () => {
    it('allows correct rook movement', () => {
      const game = createTestGame([{ position: [3, 3], piece: { type: 'rook', color: 'white' } }]);
      expect(isValidMove(game, [3, 3], [3, 7])).toBe(true);
      expect(isValidMove(game, [3, 3], [7, 3])).toBe(true);
      expect(isValidMove(game, [3, 3], [3, 0])).toBe(true);
      expect(isValidMove(game, [3, 3], [0, 3])).toBe(true);
      expect(isValidMove(game, [3, 3], [5, 5])).toBe(false);
    });

    it('allows correct bishop movement', () => {
      const game = createTestGame([{ position: [3, 3], piece: { type: 'bishop', color: 'white' } }]);
      expect(isValidMove(game, [3, 3], [5, 5])).toBe(true);
      expect(isValidMove(game, [3, 3], [1, 1])).toBe(true);
      expect(isValidMove(game, [3, 3], [5, 1])).toBe(true);
      expect(isValidMove(game, [3, 3], [1, 5])).toBe(true);
      expect(isValidMove(game, [3, 3], [3, 5])).toBe(false);
    });

    it('allows correct queen movement', () => {
      const game = createTestGame([{ position: [3, 3], piece: { type: 'queen', color: 'white' } }]);
      expect(isValidMove(game, [3, 3], [3, 7])).toBe(true);
      expect(isValidMove(game, [3, 3], [7, 3])).toBe(true);
      expect(isValidMove(game, [3, 3], [5, 5])).toBe(true);
      expect(isValidMove(game, [3, 3], [1, 1])).toBe(true);
      expect(isValidMove(game, [3, 3], [4, 5])).toBe(false);
    });

    it('allows correct king movement', () => {
      const game = createTestGame([{ position: [3, 3], piece: { type: 'king', color: 'white' } }]);
      expect(isValidMove(game, [3, 3], [3, 4])).toBe(true);
      expect(isValidMove(game, [3, 3], [4, 4])).toBe(true);
      expect(isValidMove(game, [3, 3], [2, 2])).toBe(true);
      expect(isValidMove(game, [3, 3], [3, 5])).toBe(false);
    });
  });

  describe('Pawn Special Rules', () => {
    it('allows pawn double move from starting position', () => {
      const game = createTestGame([
        { position: [1, 0], piece: { type: 'pawn', color: 'white' } },
        { position: [6, 0], piece: { type: 'pawn', color: 'black' } },
      ]);
      expect(isValidMove(game, [1, 0], [3, 0])).toBe(true);

      game.currentTurn = 'black';
      expect(isValidMove(game, [6, 0], [4, 0])).toBe(true);
    });

    it('prevents pawn double move not from starting position', () => {
      const game = createTestGame([{ position: [2, 0], piece: { type: 'pawn', color: 'white' } }]);
      expect(isValidMove(game, [2, 0], [4, 0])).toBe(false);
    });

    it('allows pawn diagonal capture', () => {
      const game = createTestGame([
        { position: [2, 1], piece: { type: 'pawn', color: 'white' } },
        { position: [3, 2], piece: { type: 'pawn', color: 'black' } },
      ]);
      expect(isValidMove(game, [2, 1], [3, 2])).toBe(true);
    });

    it('prevents pawn diagonal move without capture', () => {
      const game = createTestGame([{ position: [2, 1], piece: { type: 'pawn', color: 'white' } }]);
      expect(isValidMove(game, [2, 1], [3, 2])).toBe(false);
    });
  });

  describe('Capture Detection', () => {
    it('detects a capture correctly', () => {
      const game = createTestGame([
        { position: [3, 3], piece: { type: 'pawn', color: 'white' } },
        { position: [4, 4], piece: { type: 'pawn', color: 'black' } },
      ]);
      expect(isCapture(game.board, [4, 4])).toBe(true);
    });

    it('recognizes when there is no capture', () => {
      const game = createTestGame([{ position: [3, 3], piece: { type: 'pawn', color: 'white' } }]);
      expect(isCapture(game.board, [4, 4])).toBe(false);
    });
  });

  describe('En Passant', () => {
    it('correctly sets up en passant target', () => {
      const from: Position = [1, 0];
      const to: Position = [3, 0];
      const enPassantTarget = getEnPassantTarget(from, to);
      expect(enPassantTarget).toEqual([2, 0]);
    });

    it('allows en passant capture', () => {
      const game = createTestGame([
        { position: [4, 1], piece: { type: 'pawn', color: 'white' } },
        { position: [4, 2], piece: { type: 'pawn', color: 'black' } },
      ]);
      game.enPassantTarget = [5, 2];
      expect(isValidMove(game, [4, 1], [5, 2])).toBe(true);
    });
  });

  describe('Castling', () => {
    it('allows kingside castling', () => {
      const game = createTestGame([
        { position: [0, 4], piece: { type: 'king', color: 'white' } },
        { position: [0, 7], piece: { type: 'rook', color: 'white' } },
      ]);
      game.castlingRights.whiteKingSide = true;
      game.currentTurn = 'white';
      console.log('Game state before castling:', JSON.stringify(game, null, 2));
      const result = isValidMove(game, [0, 4], [0, 6]);
      console.log('Castling result:', result);
      expect(result).toBe(true);

      // Дополнительная проверка правильности выполнения рокировки
      if (result) {
        const newGame = performMove(game, [0, 4], [0, 6]);
        expect(newGame.board[0][6]).toEqual({ type: 'king', color: 'white' });
        expect(newGame.board[0][5]).toEqual({ type: 'rook', color: 'white' });
        expect(newGame.board[0][4]).toBeNull();
        expect(newGame.board[0][7]).toBeNull();
      }
    });

    it('allows queenside castling', () => {
      const game = createTestGame([
        { position: [0, 4], piece: { type: 'king', color: 'white' } },
        { position: [0, 0], piece: { type: 'rook', color: 'white' } },
      ]);
      game.castlingRights.whiteQueenSide = true;
      game.currentTurn = 'white';
      const result = isValidMove(game, [0, 4], [0, 2]);
      expect(result).toBe(true);

      // Дополнительная проверка правильности выполнения рокировки
      if (result) {
        const newGame = performMove(game, [0, 4], [0, 2]);
        expect(newGame.board[0][2]).toEqual({ type: 'king', color: 'white' });
        expect(newGame.board[0][3]).toEqual({ type: 'rook', color: 'white' });
        expect(newGame.board[0][4]).toBeNull();
        expect(newGame.board[0][0]).toBeNull();
      }
    });

    it('prevents castling through check', () => {
      const game = createTestGame([
        { position: [0, 4], piece: { type: 'king', color: 'white' } },
        { position: [0, 7], piece: { type: 'rook', color: 'white' } },
        { position: [4, 5], piece: { type: 'rook', color: 'black' } },
      ]);
      game.castlingRights.whiteKingSide = true;
      game.currentTurn = 'white';
      expect(isValidMove(game, [0, 4], [0, 6])).toBe(false);
    });

    it('prevents castling when king is in check', () => {
      const game = createTestGame([
        { position: [0, 4], piece: { type: 'king', color: 'white' } },
        { position: [0, 7], piece: { type: 'rook', color: 'white' } },
        { position: [4, 4], piece: { type: 'rook', color: 'black' } },
      ]);
      game.castlingRights.whiteKingSide = true;
      game.currentTurn = 'white';
      expect(isValidMove(game, [0, 4], [0, 6])).toBe(false);
    });

    it('prevents castling when king would end up in check', () => {
      const game = createTestGame([
        { position: [0, 4], piece: { type: 'king', color: 'white' } },
        { position: [0, 7], piece: { type: 'rook', color: 'white' } },
        { position: [7, 6], piece: { type: 'rook', color: 'black' } },
      ]);
      game.castlingRights.whiteKingSide = true;
      game.currentTurn = 'white';
      expect(isValidMove(game, [0, 4], [0, 6])).toBe(false);
    });
  });

  describe('Check and Checkmate Detection', () => {
    it('detects check correctly', () => {
      const game = createTestGame([
        { position: [0, 4], piece: { type: 'king', color: 'white' } },
        { position: [2, 4], piece: { type: 'rook', color: 'black' } },
      ]);
      expect(isKingInCheck(game).inCheck).toBe(true);
    });

    it('detects checkmate correctly', () => {
      const game = createTestGame([
        { position: [0, 0], piece: { type: 'king', color: 'white' } },
        { position: [1, 1], piece: { type: 'queen', color: 'black' } },
        { position: [1, 2], piece: { type: 'rook', color: 'black' } },
      ]);
      expect(isCheckmate(game)).toBe(true);
    });
  });

  describe('Stalemate Detection', () => {
    it('detects stalemate correctly', () => {
      const game = createTestGame(
        [
          { position: [0, 0], piece: { type: 'king', color: 'white' } },
          { position: [2, 1], piece: { type: 'queen', color: 'black' } },
          { position: [2, 2], piece: { type: 'king', color: 'black' } },
        ],
        'white'
      );
      expect(isStalemate(game)).toBe(true);
    });
  });

  describe('Draw Conditions', () => {
    it('detects insufficient material', () => {
      const game = createTestGame([
        { position: [0, 0], piece: { type: 'king', color: 'white' } },
        { position: [7, 7], piece: { type: 'king', color: 'black' } },
        { position: [0, 1], piece: { type: 'knight', color: 'white' } },
      ]);
      expect(hasInsufficientMaterial(game.board)).toBe(true);
    });

    it('updates position history correctly', () => {
      const game = createTestGame([
        { position: [0, 0], piece: { type: 'king', color: 'white' } },
        { position: [7, 7], piece: { type: 'king', color: 'black' } },
      ]);
      const positions: string[] = [];
      const updatedPositions = updatePositionsHistory(positions, game.board);
      expect(updatedPositions.length).toBe(1);
      expect(JSON.parse(updatedPositions[0])).toEqual(game.board);
    });
  });

  describe('Move Execution', () => {
    it('executes a move correctly', () => {
      const game = createTestGame([{ position: [1, 0], piece: { type: 'pawn', color: 'white' } }]);
      const from: Position = [1, 0];
      const to: Position = [3, 0];
      const updatedGame = performMove(game, from, to);
      expect(updatedGame.board[3][0]).toEqual({ type: 'pawn', color: 'white' });
      expect(updatedGame.board[1][0]).toBeNull();
      expect(updatedGame.currentTurn).toBe('black');
      expect(updatedGame.moveCount).toBe(1);
    });

    it('handles pawn promotion', () => {
      const game = createTestGame([{ position: [6, 0], piece: { type: 'pawn', color: 'white' } }]);
      const updatedGame = performMove(game, [6, 0], [7, 0]);
      expect(updatedGame.board[7][0]?.type).toBe('queen');
    });
  });

  describe('Game State Updates', () => {
    it('increments move count correctly', () => {
      const game = createTestGame([{ position: [1, 0], piece: { type: 'pawn', color: 'white' } }]);
      const updatedGame = performMove(game, [1, 0], [3, 0]);
      expect(updatedGame.moveCount).toBe(1);
    });

    it('switches turn correctly', () => {
      const game = createTestGame([{ position: [1, 0], piece: { type: 'pawn', color: 'white' } }]);
      const updatedGame = performMove(game, [1, 0], [3, 0]);
      expect(updatedGame.currentTurn).toBe('black');
    });
  });
});
