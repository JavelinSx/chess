import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performMove } from '~/features/game-logic/model/game-logic/move-execution';
import { isValidMove } from '~/features/game-logic/model/game-logic/moves';
import { isKingInCheck } from '~/features/game-logic/model/game-logic/check';
import { isDraw } from '~/features/game-logic/model/game-state/draw';
import { makeMove, isCapture } from '~/features/game-logic/model/game-logic/board';
import { isPawnMove, hasInsufficientMaterial, promotePawn } from '~/features/game-logic/model/game-logic/special-moves';
import { isPawnDoubleMove, getEnPassantTarget } from '~/features/game-logic/model/pieces/pawn';
import { updateCastlingRights } from '~/features/game-logic/model/game-logic/castling';
import { updatePositionsHistory } from '~/features/game-logic/model/game-logic/utils';
import { isCheckmate, isStalemate } from '~/features/game-logic/model/game-logic/check';
import { generateAllMoves } from '~/features/game-logic/model/game-state/move-generation';
import type { ChessGame } from '../entities/game/model/game.model';
import type { ChessBoard, ChessPiece } from '~/entities/game/model/board.model';
import type { Position } from '~/features/game-logic/model/pieces/types';
import { initializeGame } from '../entities/game/model/game.model';
import Game from '~/server/db/models/game.model';
// Мокаем SSEManager
vi.mock('~/server/utils/SSEManager', () => ({
  sseManager: {
    broadcastGameUpdate: vi.fn(),
  },
}));

// Мокаем модель Game
vi.mock('~/server/db/models/game.model', () => {
  const mockFindOne = vi.fn();
  const mockFindOneAndUpdate = vi.fn();
  return {
    default: {
      findOne: mockFindOne,
      findOneAndUpdate: mockFindOneAndUpdate,
    },
  };
});

import { handlePawnPromotion } from '~/server/services/game.service';
import { sseManager } from '~/server/utils/SSEManager';

const mockFindOne = vi.mocked(Game.findOne);
const mockFindOneAndUpdate = vi.mocked(Game.findOneAndUpdate);

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
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('promotes a pawn correctly and updates game state', async () => {
    // Создаем тестовую игру
    const game = createTestGame([{ position: [0, 7], piece: { type: 'pawn', color: 'black' } }]);
    game.id = 'test-game-id';
    game.players = { white: 'player-456', black: 'player-123' };
    game.currentTurn = 'black';
    game.pendingPromotion = { from: [1, 7], to: [0, 7] };

    // Мокаем поиск игры в базе данных
    mockFindOne.mockResolvedValue(game);

    // Проверяем состояние до продвижения
    expect(game.board[0][7]).toEqual({ type: 'pawn', color: 'black' });
    console.log('Initial game state:', JSON.stringify(game.board[0][7]));

    // Выполняем продвижение
    const pieceType = 'queen';
    await handlePawnPromotion(game.id, [0, 7], pieceType, 'player-123');

    // Проверяем, что игра была обновлена в базе данных
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { id: game.id },
      expect.objectContaining({
        board: expect.any(Array),
        pendingPromotion: null,
        currentTurn: 'white',
      })
    );

    // Получаем обновленную игру из мока
    const updatedGame = mockFindOneAndUpdate.mock.calls[0][1];
    if (updatedGame) {
      // Проверяем состояние после продвижения
      expect(updatedGame.board[0][7]).toEqual({ type: pieceType, color: 'black' });
      console.log('Updated game state:', JSON.stringify(updatedGame.board[0][7]));

      // Проверяем, что SSE было отправлено
      expect(sseManager.broadcastGameUpdate).toHaveBeenCalledWith(game.id, expect.any(Object));

      // Проверяем, что ход перешел к другому игроку
      expect(updatedGame.currentTurn).toBe('white');

      // Проверяем, что pendingPromotion был сброшен
      expect(updatedGame.pendingPromotion).toBeNull();
    } else {
      console.log('error');
    }
  });

  it('throws an error when trying to promote without pending promotion', async () => {
    const game = createTestGame([{ position: [0, 7], piece: { type: 'pawn', color: 'black' } }]);
    game.id = 'test-game-id';
    game.players = { white: 'player-456', black: 'player-123' };
    game.currentTurn = 'black';
    game.pendingPromotion = null;

    mockFindOne.mockResolvedValue(game);

    await expect(handlePawnPromotion(game.id, [0, 7], 'queen', 'player-123')).rejects.toThrow('No pending promotion');

    expect(sseManager.broadcastGameUpdate).not.toHaveBeenCalled();
  });

  it('throws an error when wrong player tries to promote', async () => {
    const game = createTestGame([{ position: [0, 7], piece: { type: 'pawn', color: 'black' } }]);
    game.id = 'test-game-id';
    game.players = { white: 'player-456', black: 'player-123' };
    game.currentTurn = 'black';
    game.pendingPromotion = { from: [1, 7], to: [0, 7] };

    mockFindOne.mockResolvedValue(game);

    await expect(handlePawnPromotion(game.id, [0, 7], 'queen', 'wrong-player-id')).rejects.toThrow(
      'Not your turn to promote'
    );

    expect(sseManager.broadcastGameUpdate).not.toHaveBeenCalled();
  });

  // ... остальные тесты ...

  describe('Move Execution', () => {
    // ... другие тесты ...

    it('sets up pawn promotion', () => {
      const game = createTestGame([{ position: [6, 0], piece: { type: 'pawn', color: 'white' } }]);
      const updatedGame = performMove(game, [6, 0], [7, 0]);
      expect(updatedGame.pendingPromotion).toEqual({ from: [6, 0], to: [7, 0] });
      expect(updatedGame.board[7][0]?.type).toBe('pawn');
    });
  });

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

    it('sets up pawn promotion', () => {
      const game = createTestGame([{ position: [6, 0], piece: { type: 'pawn', color: 'white' } }]);
      const updatedGame = performMove(game, [6, 0], [7, 0]);
      expect(updatedGame.pendingPromotion).toEqual({ from: [6, 0], to: [7, 0] });
      expect(updatedGame.board[7][0]?.type).toBe('pawn');
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
