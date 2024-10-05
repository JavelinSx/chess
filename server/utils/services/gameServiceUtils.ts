import type { ChessBoard, PieceType, Position, MoveHistoryEntry, ChessGame, GameResult } from '~/server/types/game';

export function initializeBoard(): ChessBoard {
  const board: ChessBoard = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
  const piecesOrder: PieceType[] = ['king'];

  for (let i = 0; i < 8; i++) {
    board[5][i] = { type: 'pawn', color: 'white' };
    board[2][i] = { type: 'pawn', color: 'black' };
    board[0][i] = { type: piecesOrder[i], color: 'white' };
    board[7][i] = { type: piecesOrder[i], color: 'black' };
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

export function updatePlayerStats(
  stats: any,
  game: ChessGame,
  isWinner: boolean,
  playerColor: 'white' | 'black'
): void {
  const playerMoves = game.moveHistory.filter((move) => move.player === stats._id.toString());
  const specialMoves = countSpecialMoves(playerMoves);
  stats.gamesPlayed++;
  stats.capturedPawns += game.capturedPieces[playerColor].filter((piece) => piece === 'pawn').length;
  stats.checksGiven += playerMoves.filter((move) => move.isCheck).length;
  stats.castlingsMade += playerMoves.filter((move) => move.isCastling).length;
  stats.promotions += playerMoves.filter((move) => move.isPromotion).length;
  stats.enPassantCaptures += playerMoves.filter((move) => move.isEnPassant).length;
  stats.queenSacrifices += specialMoves.queenSacrifices;
  stats.discoveredChecks += specialMoves.discoveredChecks;
  stats.doubleChecks += specialMoves.doubleChecks;

  stats.averageMovesPerGame =
    (stats.averageMovesPerGame * stats.gamesPlayed + game.moveCount) / (stats.gamesPlayed + 1);
  stats.longestGame = Math.max(stats.longestGame, game.moveCount);

  if (isWinner) {
    stats.gamesWon++;
    stats.shortestWin = Math.min(stats.shortestWin, game.moveCount);
    stats.currentWinStreak++;
    stats.winStreakBest = Math.max(stats.winStreakBest, stats.currentWinStreak);
  } else {
    stats.gamesLose++;
    stats.currentWinStreak = 0;
  }

  if (game.result?.reason === 'forfeit' && isWinner) {
    stats.resignations++;
  }
  if (game.result?.reason === 'draw') {
    stats.gamesDraw++;
  }
}
