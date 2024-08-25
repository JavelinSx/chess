// server/services/game.service.ts

import Game from '~/server/db/models/game.model';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { ChessBoard } from '~/entities/game/model/board.model';
import type { PieceType, PieceColor } from '~/entities/game/model/board.model';
import type { Position } from '~/features/game-logic/model/pieces/types';
import type { GameResult } from '../types/game';
import { updateUserStatus, updateUserStats } from './user.service';
import { sseManager } from '~/server/utils/SSEManager';
import { getUsersList } from './user.service';
import { getUserById } from './user.service';
import { promotePawn } from '~/features/game-logic/model/game-logic/special-moves';
import { performMove } from '~/features/game-logic/model/game-logic/move-execution';
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
export async function handleMove(gameId: string, from: Position, to: Position): Promise<void> {
  const game = await Game.findOne({ id: gameId });
  if (!game) throw new Error('Game not found');

  const updatedGame = performMove(game.toObject(), from, to);

  await Game.findOneAndUpdate({ id: gameId }, updatedGame);
  await sseManager.broadcastGameUpdate(gameId, updatedGame);
}

export async function endGame(gameId: string, result: GameResult) {
  const game = await Game.findOne({ id: gameId });
  if (!game) {
    throw new Error('Game not found');
  }

  game.status = 'completed';
  game.winner = result.winner;
  game.loser = result.loser;
  await game.save();

  const whitePlayer = game.players.white as string;
  const blackPlayer = game.players.black as string;

  // Обновляем статистику обоих игроков
  await updateUserStats(whitePlayer, result.winner === 'white' ? 'win' : result.winner === 'black' ? 'loss' : 'draw');
  await updateUserStats(blackPlayer, result.winner === 'black' ? 'win' : result.winner === 'white' ? 'loss' : 'draw');

  // Получаем обновленные данные игроков
  const updatedWhitePlayer = await getUserById(whitePlayer);
  const updatedBlackPlayer = await getUserById(blackPlayer);

  // Отправляем обновления игрокам
  if (updatedWhitePlayer && updatedBlackPlayer) {
    await sseManager.sendUserUpdate(whitePlayer, updatedWhitePlayer);
    await sseManager.sendUserUpdate(blackPlayer, updatedBlackPlayer);
  }

  // Отправляем уведомление о завершении игры
  await sseManager.sendGameEndNotification(gameId, result);

  // Обновляем список игроков для всех клиентов
  const updatedUsersList = await getUsersList();
  await sseManager.broadcastUserListUpdate(updatedUsersList);

  return { whitePlayer: updatedWhitePlayer, blackPlayer: updatedBlackPlayer };
}

// Обновляем функцию forcedEndGame, чтобы использовать новую endGame
export async function forcedEndGame(gameId: string, userId: string) {
  const game = await Game.findOne({ id: gameId });
  if (!game) {
    throw new Error('Game not found');
  }

  const winner = game.players.white === userId ? game.players.black : game.players.white;
  const loser = userId;
  const result: GameResult = {
    winner,
    loser,
    reason: 'forfeit',
  };

  return await endGame(gameId, result);
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
  const piecesBlack: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  const piecesWhite: PieceType[] = ['rook', 'knight', 'bishop', 'king', 'queen', 'bishop', 'knight', 'rook'];
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: piecesBlack[i], color: 'white' };
    board[7][i] = { type: piecesWhite[i], color: 'black' };
  }

  return board;
}
