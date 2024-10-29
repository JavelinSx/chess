import type { ChessBoard, PieceType, Position, MoveHistoryEntry, ChessGame, GameResult } from '~/server/types/game';
import type { IUser } from '~/server/types/user';

export function initializeBoard(): ChessBoard {
  const board: ChessBoard = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  const piecesOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  for (let i = 0; i < 8; i++) {
    // Расставляем белые фигуры
    board[0][i] = { type: piecesOrder[i], color: 'white' };
    board[1][i] = { type: 'pawn', color: 'white' };

    // Расставляем черные фигуры
    board[7][i] = { type: piecesOrder[i], color: 'black' };
    board[6][i] = { type: 'pawn', color: 'black' };
  }

  return board;
}

export function countSpecialMoves(moves: MoveHistoryEntry[]): {
  queenSacrifices: number;
  discoveredChecks: number;
  doubleChecks: number;
} {
  let queenSacrifices = 0;
  let discoveredChecks = 0;
  let doubleChecks = 0;

  moves.forEach((move, index) => {
    if (move.piece.type === 'queen' && move.capturedPiece && move.capturedPiece.type !== 'queen') {
      queenSacrifices++;
    }
    if (move.isCheck && move.piece.type !== 'knight' && move.piece.type !== 'queen') {
      discoveredChecks++;
    }
    if (index > 0 && move.isCheck && moves[index - 1].isCheck) {
      doubleChecks++;
    }
  });

  return { queenSacrifices, discoveredChecks, doubleChecks };
}

function calculateEloRatingChange(
  playerRating: number,
  opponentRating: number,
  result: 'win' | 'loss' | 'draw'
): number {
  const K = 32; // Фактор K, определяющий максимальное изменение рейтинга
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actualScore = result === 'win' ? 1 : result === 'loss' ? 0 : 0.5;
  if (Math.round(K * (actualScore - expectedScore)) < 0) {
    return 0;
  } else {
    return Math.round(K * (actualScore - expectedScore));
  }
}

export function updatePlayerStats(
  player: IUser,
  opponent: IUser,
  game: ChessGame,
  isWinner: boolean,
  playerColor: 'white' | 'black'
): number {
  const playerMoves = game.moveHistory.filter((move) => move.player === player._id.toString());
  const specialMoves = countSpecialMoves(playerMoves);

  // Рассчитываем изменение рейтинга
  const result = isWinner ? 'win' : game.result?.reason === 'draw' ? 'draw' : 'loss';
  const ratingChange = calculateEloRatingChange(player.rating, opponent.rating, result);

  // Обновляем рейтинг
  player.rating += ratingChange;

  // Обновляем averageRatingChange
  player.stats.averageRatingChange =
    (player.stats.averageRatingChange * player.stats.gamesPlayed + ratingChange) / (player.stats.gamesPlayed + 1);

  // Остальные обновления статистики
  player.stats.gamesPlayed++;
  player.stats.capturedPawns += game.capturedPieces[playerColor].filter((piece) => piece === 'pawn').length;
  player.stats.checksGiven += playerMoves.filter((move) => move.isCheck).length;
  player.stats.castlingsMade += playerMoves.filter((move) => move.isCastling).length;
  player.stats.promotions += playerMoves.filter((move) => move.isPromotion).length;
  player.stats.enPassantCaptures += playerMoves.filter((move) => move.isEnPassant).length;
  player.stats.queenSacrifices += specialMoves.queenSacrifices;
  player.stats.averageMovesPerGame =
    (player.stats.averageMovesPerGame * player.stats.gamesPlayed + game.moveCount) / (player.stats.gamesPlayed + 1);
  player.stats.longestGame = Math.max(player.stats.longestGame, game.moveCount);

  if (isWinner) {
    player.stats.gamesWon++;
    player.stats.shortestWin = Math.min(player.stats.shortestWin || Infinity, game.moveCount);
    player.stats.currentWinStreak++;
    player.stats.winStreakBest = Math.max(player.stats.winStreakBest, player.stats.currentWinStreak);
  } else if (game.result?.reason === 'draw') {
    player.stats.gamesDraw++;
    player.stats.currentWinStreak = 0;
  } else {
    player.stats.gamesLost++;
    player.stats.currentWinStreak = 0;
  }

  if (game.result?.reason === 'forfeit' && isWinner) {
    player.stats.resignations++;
  }

  // Обновляем статистику по длительности игр
  if (game.timeControl && game.timeControl.type === 'timed' && game.timeControl.initialTime) {
    const gameDuration = game.timeControl.initialTime;
    if (gameDuration === 15 || gameDuration === 30 || gameDuration === 45 || gameDuration === 90) {
      player.stats.gamesByDuration[gameDuration] = (player.stats.gamesByDuration[gameDuration] || 0) + 1;
    }
  }

  // Обновляем winRate
  player.winRate = (player.stats.gamesWon / player.stats.gamesPlayed) * 100;

  return ratingChange;
}
