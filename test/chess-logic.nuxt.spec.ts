import { describe, it, expect, beforeEach } from 'vitest';
import {
  performMove,
  isValidMove,
  isKingInCheck,
  isDraw,
  makeMove,
  isCapture,
  isPawnMove,
  isPawnDoubleMove,
  getEnPassantTarget,
  updateCastlingRights,
  updatePositionsHistory,
  hasInsufficientMaterial,
} from '../features/game-logic/model/chess-logic';
import { isCheckmate, isStalemate, generateAllMoves } from '~/features/game-logic/model/game-state';
import type { ChessGame } from '../entities/game/model/game.model';
import type { ChessBoard } from '~/entities/game/model/board.model';
import type { GameState } from '../features/game-logic/model/chess-logic';
import type { Position } from '~/features/game-logic/model/pieces/types';
import { initializeGame } from '../entities/game/model/game.model';

describe('Chess Logic', () => {
  let game: ChessGame;
  let board: ChessBoard;
  let gameState: GameState;

  beforeEach(() => {
    game = initializeGame('testGame', 'player1', 'player2');
    board = game.board;
    gameState = {
      moveCount: 0,
      halfMoveClock: 0,
      enPassantTarget: null,
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true,
      },
      positions: [],
      status: 'active',
      winner: null,
      currentTurn: 'white',
    };
  });

  // ... [предыдущие тесты остаются без изменений]

  describe('Piece Movement', () => {
    it('allows correct rook movement', () => {
      board[3][3] = { type: 'rook', color: 'white' };
      expect(isValidMove(board, [3, 3], [3, 7], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [7, 3], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [3, 0], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [0, 3], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [5, 5], 'white', game)).toBe(false);
    });

    it('allows correct bishop movement', () => {
      board[3][3] = { type: 'bishop', color: 'white' };
      expect(isValidMove(board, [3, 3], [5, 5], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [1, 1], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [5, 1], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [1, 5], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [3, 5], 'white', game)).toBe(false);
    });

    it('allows correct queen movement', () => {
      board[3][3] = { type: 'queen', color: 'white' };
      expect(isValidMove(board, [3, 3], [3, 7], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [7, 3], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [5, 5], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [1, 1], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [4, 5], 'white', game)).toBe(false);
    });

    it('allows correct king movement', () => {
      board[3][3] = { type: 'king', color: 'white' };
      expect(isValidMove(board, [3, 3], [3, 4], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [4, 4], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [2, 2], 'white', game)).toBe(true);
      expect(isValidMove(board, [3, 3], [3, 5], 'white', game)).toBe(false);
    });
  });

  describe('Pawn Special Rules', () => {
    it('allows pawn double move from starting position', () => {
      expect(isValidMove(board, [1, 0], [3, 0], 'white', game)).toBe(true);
      expect(isValidMove(board, [6, 0], [4, 0], 'black', game)).toBe(true);
    });

    it('prevents pawn double move not from starting position', () => {
      board[2][0] = { type: 'pawn', color: 'white' };
      expect(isValidMove(board, [2, 0], [4, 0], 'white', game)).toBe(false);
    });

    it('allows pawn diagonal capture', () => {
      board[2][1] = { type: 'pawn', color: 'white' };
      board[3][2] = { type: 'pawn', color: 'black' };
      expect(isValidMove(board, [2, 1], [3, 2], 'white', game)).toBe(true);
    });

    it('prevents pawn diagonal move without capture', () => {
      board[2][1] = { type: 'pawn', color: 'white' };
      expect(isValidMove(board, [2, 1], [3, 2], 'white', game)).toBe(false);
    });
  });

  describe('Capture Detection', () => {
    it('detects a capture correctly', () => {
      board[3][3] = { type: 'pawn', color: 'white' };
      board[4][4] = { type: 'pawn', color: 'black' };
      expect(isCapture(board, [4, 4])).toBe(true);
    });

    it('recognizes when there is no capture', () => {
      board[3][3] = { type: 'pawn', color: 'white' };
      expect(isCapture(board, [4, 4])).toBe(false);
    });
  });

  describe('En Passant', () => {
    it('correctly sets up en passant target', () => {
      const from: [number, number] = [1, 0];
      const to: [number, number] = [3, 0];
      const enPassantTarget = getEnPassantTarget(from, to);
      expect(enPassantTarget).toEqual([2, 0]);
    });

    it('allows en passant capture', () => {
      game.board[4][1] = { type: 'pawn', color: 'white' };
      game.board[4][2] = { type: 'pawn', color: 'black' };
      game.enPassantTarget = [5, 2];
      expect(isValidMove(game.board, [4, 1], [5, 2], 'white', game)).toBe(true);
    });
  });

  describe('Castling', () => {
    it('allows kingside castling', () => {
      board[0][4] = { type: 'king', color: 'white' };
      board[0][7] = { type: 'rook', color: 'white' };
      gameState.castlingRights.whiteKingSide = true;
      expect(isValidMove(board, [0, 4], [0, 6], 'white', gameState)).toBe(true);
    });

    it('allows queenside castling', () => {
      board[0][4] = { type: 'king', color: 'white' };
      board[0][0] = { type: 'rook', color: 'white' };
      gameState.castlingRights.whiteQueenSide = true;
      expect(isValidMove(board, [0, 4], [0, 2], 'white', gameState)).toBe(true);
    });
  });

  describe('Check and Checkmate Detection', () => {
    it('detects check correctly', () => {
      board[0][4] = { type: 'king', color: 'white' };
      board[2][4] = { type: 'rook', color: 'black' };
      expect(isKingInCheck(board, 'white', gameState)).toBe(true);
    });

    it('detects checkmate correctly', () => {
      board = Array(8)
        .fill(null)
        .map(() => Array(8).fill(null));
      board[0][0] = { type: 'king', color: 'white' };
      board[1][1] = { type: 'queen', color: 'black' };
      board[1][2] = { type: 'rook', color: 'black' };
      expect(isCheckmate(board, 'white', gameState)).toBe(true);
    });
  });

  describe('Stalemate Detection', () => {
    it('detects stalemate correctly', () => {
      board = Array(8)
        .fill(null)
        .map(() => Array(8).fill(null));
      board[0][0] = { type: 'king', color: 'white' };
      board[2][1] = { type: 'queen', color: 'black' };
      gameState.currentTurn = 'white';
      expect(isStalemate(board, 'white', gameState)).toBe(true);
    });
  });

  describe('Draw Conditions', () => {
    it('detects insufficient material', () => {
      game.board = Array(8)
        .fill(null)
        .map(() => Array(8).fill(null));
      game.board[0][0] = { type: 'king', color: 'white' };
      game.board[7][7] = { type: 'king', color: 'black' };
      game.board[0][1] = { type: 'knight', color: 'white' };
      expect(hasInsufficientMaterial(game.board)).toBe(true);
    });

    it('updates position history correctly', () => {
      const positions: string[] = [];
      const updatedPositions = updatePositionsHistory(positions, game.board);
      expect(updatedPositions.length).toBe(1);
      expect(JSON.parse(updatedPositions[0])).toEqual(game.board);
    });
  });

  describe('Move Execution', () => {
    it('executes a move correctly', () => {
      const from: Position = [1, 0];
      const to: Position = [3, 0];
      const { newBoard, updatedGame } = performMove(game, from, to);
      expect(newBoard[3][0]).toEqual({ type: 'pawn', color: 'white' });
      expect(newBoard[1][0]).toBeNull();
      expect(updatedGame.currentTurn).toBe('black');
      expect(updatedGame.moveCount).toBe(1);
    });

    it('handles pawn promotion', () => {
      game.board[6][0] = { type: 'pawn', color: 'white' };
      const { updatedGame } = performMove(game, [6, 0] as Position, [7, 0] as Position);
      expect(updatedGame.board[7][0]?.type).toBe('queen');
    });
  });

  describe('Game State Updates', () => {
    it('increments move count correctly', () => {
      const { updatedGame } = performMove(game, [1, 0], [3, 0]);
      expect(updatedGame.moveCount).toBe(1);
    });

    it('switches turn correctly', () => {
      const { updatedGame } = performMove(game, [1, 0], [3, 0]);
      expect(updatedGame.currentTurn).toBe('black');
    });
  });
});
