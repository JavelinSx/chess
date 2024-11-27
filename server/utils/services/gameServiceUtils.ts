import type { ChessBoard, PieceType, Position, MoveHistoryEntry, ChessGame, GameResult } from '~/server/types/game';
import type { IUser } from '~/server/types/user';
import type { UserStats } from '~/server/types/user';
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
//расстановка для теста прохода пешки
// export function initializeBoard(): ChessBoard {
//   const board: ChessBoard = Array(8)
//     .fill(null)
//     .map(() => Array(8).fill(null));

//   // Расставляем белые фигуры
//   board[3][4] = { type: 'king', color: 'white' }; // Белый король

//   // Расставляем черные фигуры
//   board[4][0] = { type: 'king', color: 'black' }; // Черный король под шахом
//   for (let i = 0; i < 8; i++) {
//     // Расставляем белые фигуры

//     board[6][i] = { type: 'pawn', color: 'white' };

//     // Расставляем черные фигуры

//     board[1][i] = { type: 'pawn', color: 'black' };
//   }

//   return board;
// }

export async function updateGameStats(
  stats: UserStats,
  game: ChessGame,
  isWinner: boolean,
  playerColor: 'white' | 'black'
): Promise<UserStats> {
  // Создаем новый объект статистики
  const newStats: UserStats = { ...stats };

  // Обновляем базовую статистику игр
  newStats.gamesPlayed++;

  if (isWinner) {
    newStats.gamesWon++;
    newStats.currentWinStreak++;
    newStats.winStreakBest = Math.max(newStats.winStreakBest, newStats.currentWinStreak);
    // Обновляем рекорд самой быстрой победы
    if (game.moveCount < (newStats.shortestWin || Infinity)) {
      newStats.shortestWin = game.moveCount;
    }
  } else if (game.result.reason === 'draw') {
    newStats.gamesDraw++;
    newStats.currentWinStreak = 0;
  } else {
    newStats.gamesLost++;
    newStats.currentWinStreak = 0;
  }

  // Подсчет захваченных фигур
  const opponentColor = playerColor === 'white' ? 'black' : 'white';
  newStats.capturedPawns += game.capturedPieces[opponentColor].filter((piece) => piece === 'pawn').length;

  // Анализ истории ходов для специальных событий
  game.moveHistory.forEach((move) => {
    if (move.player === playerColor) {
      // Подсчет шахов и специальных ходов
      if (move.isCheck) newStats.checksGiven++;
      if (move.isCastling) newStats.castlingsMade++;
      if (move.isPromotion) newStats.promotions++;
      if (move.isEnPassant) newStats.enPassantCaptures++;

      // Отслеживание жертв ферзя
      if (move.piece.type === 'queen' && move.capturedPiece && move.capturedPiece.type !== 'queen') {
        newStats.queenSacrifices++;
      }
    }
  });

  // Обновление среднего количества ходов за игру
  const totalMoves = newStats.averageMovesPerGame * (newStats.gamesPlayed - 1);
  newStats.averageMovesPerGame = (totalMoves + game.moveCount) / newStats.gamesPlayed;

  // Обновление рекорда самой длинной игры
  if (game.moveCount > newStats.longestGame) {
    newStats.longestGame = game.moveCount;
  }

  // Подсчет сдач
  if (game.result.reason === 'forfeit' && !isWinner) {
    newStats.resignations++;
  }

  // Статистика по контролю времени
  if (game.timeControl?.type === 'timed' && game.timeControl.initialTime) {
    const duration = game.timeControl.initialTime;
    if (duration === 15 || duration === 30 || duration === 45 || duration === 90) {
      if (!newStats.gamesByDuration) {
        newStats.gamesByDuration = { 15: 0, 30: 0, 45: 0, 90: 0 };
      }
      newStats.gamesByDuration[duration] = (newStats.gamesByDuration[duration] || 0) + 1;
    }
  }
  return newStats;
}

export function calculateEloChange(
  playerRating: number,
  opponentRating: number,
  result: 'win' | 'loss' | 'draw'
): number {
  const K = 32; // Коэффициент изменения рейтинга
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actualScore = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;

  const change = Math.round(K * (actualScore - expectedScore));
  return change;
}

export async function processGameEnd(
  game: ChessGame,
  result: GameResult
): Promise<{ ratingChanges: Record<string, number> }> {
  const ratingChanges: Record<string, number> = {};

  // Получаем игроков
  const whitePlaying = game.players.white;
  const blackPlaying = game.players.black;

  if (!whitePlaying || !blackPlaying) {
    throw new Error('Неверные данные игроков');
  }

  // Определяем результат для каждого игрока
  const getResult = (playerId: string): 'win' | 'loss' | 'draw' => {
    if (result.reason === 'draw') return 'draw';
    return playerId === result.winner ? 'win' : 'loss';
  };

  // Рассчитываем и применяем изменения рейтинга
  ratingChanges[whitePlaying._id] = calculateEloChange(
    whitePlaying.rating,
    blackPlaying.rating,
    getResult(whitePlaying._id)
  );

  ratingChanges[blackPlaying._id] = calculateEloChange(
    blackPlaying.rating,
    whitePlaying.rating,
    getResult(blackPlaying._id)
  );

  return { ratingChanges };
}
