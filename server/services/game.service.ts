// server/services/game.service.ts

import Game from '~/server/db/models/game.model';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { ChessBoard } from '~/entities/game/model/board.model';
import type { PieceType, PieceColor } from '~/entities/game/model/board.model';
import { updateUserStatus } from './user.service';
export async function createGame(inviterId: string, inviteeId: string): Promise<ChessGame> {
  const newGame = new Game({
    id: generateUniqueId(),
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
  });

  await newGame.save();
  return newGame.toObject();
}

export async function getGameFromDatabase(gameId: string): Promise<ChessGame | null> {
  const game = await Game.findOne({ id: gameId });
  return game ? game.toObject() : null;
}

export async function saveGameToDatabase(game: ChessGame): Promise<void> {
  await Game.findOneAndUpdate({ id: game.id }, game, { new: true });
}

export async function updateGameStatus(gameId: string, status: 'waiting' | 'active' | 'completed'): Promise<void> {
  await Game.findOneAndUpdate({ id: gameId }, { status });
}

export async function setPlayerColor(gameId: string, userId: string, color: PieceColor): Promise<void> {
  await Game.findOneAndUpdate({ id: gameId }, { [`players.${color}`]: userId });
}

export async function forcedEndGame(gameId: string, userId: string) {
  const game = await Game.findById(gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  const winner = game.players.white === userId ? game.players.black : game.players.white;
  const loser = userId;
  const opponentId = winner;

  game.status = 'completed';
  game.winner = winner as PieceColor;
  await game.save();

  // Обновляем статусы обоих игроков
  await updateUserStatus(winner as PieceColor, false, false);
  await updateUserStatus(loser, false, false);

  // Удаляем игру из БД
  await Game.findByIdAndDelete(gameId);

  return { winner, loser, opponentId };
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
