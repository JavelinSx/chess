// server/services/game.service.ts
import type { ChessBoard } from '~/entities/game/model/board.model';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { PieceColor } from '~/entities/game/model/board.model';
import type { PieceType } from '~/entities/game/model/board.model';

// Это временное хранилище для игр. В реальном приложении вы бы использовали базу данных.
const games: Record<string, ChessGame> = {};

export async function createGame(inviterId: string, inviteeId: string): Promise<ChessGame> {
  const gameId = generateUniqueId();
  const newGame: ChessGame = {
    id: gameId,
    board: initializeBoard(),
    currentTurn: 'white',
    players: {
      white: null,
      black: null,
    },
    status: 'waiting',
    winner: null,
    inviterId,
    inviteeId,
  };

  games[gameId] = newGame;
  return newGame;
}

export async function getGameFromDatabase(gameId: string): Promise<ChessGame | null> {
  return games[gameId] || null;
}

export async function saveGameToDatabase(game: ChessGame): Promise<void> {
  games[game.id] = game;
}

export async function updateGameStatus(gameId: string, status: 'waiting' | 'active' | 'completed'): Promise<void> {
  const game = games[gameId];
  if (game) {
    game.status = status;
  }
}

export async function setPlayerColor(gameId: string, userId: string, color: PieceColor): Promise<void> {
  const game = games[gameId];
  if (game) {
    game.players[color] = userId;
  }
}

function generateUniqueId(): string {
  return Date.now().toString();
}

function initializeBoard(): ChessBoard {
  const board: ChessBoard = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Расставляем пешки
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: 'pawn', color: 'white' };
    board[6][i] = { type: 'pawn', color: 'black' };
  }

  // Расставляем остальные фигуры
  const pieces: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: pieces[i], color: 'white' };
    board[7][i] = { type: pieces[i], color: 'black' };
  }

  return board;
}
