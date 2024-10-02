// store/GameAdditional.ts
import { defineStore } from 'pinia';
import { useGameStore } from './game';
import { useUserStore } from './user';
import { getTitleForRating } from '~/server/utils/titles';
import type { ChessBoard } from '~/server/types/game';

export const useGameAdditionalStore = defineStore('gameAdditional', {
  state: () => ({
    gameDuration: 30,
    whiteTimeRemaining: 0,
    blackTimeRemaining: 0,
    gameStatus: 'not_started' as 'not_started' | 'active' | 'completed',
  }),

  getters: {
    currentTurn(): 'white' | 'black' | null {
      const gameStore = useGameStore();
      return gameStore.currentGame?.currentTurn || null;
    },
  },

  actions: {
    setGameDuration(duration: number) {
      this.gameDuration = duration;
      this.whiteTimeRemaining = duration * 60;
      this.blackTimeRemaining = duration * 60;
    },

    updateTime(color: 'white' | 'black', timeRemaining: number) {
      if (color === 'white') {
        this.whiteTimeRemaining = timeRemaining;
      } else {
        this.blackTimeRemaining = timeRemaining;
      }
    },

    handleTimeUp(player: 'white' | 'black') {
      const gameStore = useGameStore();
      if (!gameStore.currentGame) return;

      const winner = this.determineWinner(player);
      const loser = winner === 'white' ? 'black' : 'white';
      gameStore.handleGameEnd({
        winner: winner,
        loser: loser,
        reason: 'timeout',
      });
      this.gameStatus = 'completed';
    },

    determineWinner(playerOutOfTime: 'white' | 'black'): 'white' | 'black' | 'draw' {
      const gameStore = useGameStore();
      if (!gameStore.currentGame) return 'draw';

      const materialDifference = this.evaluateMaterialDifference(gameStore.currentGame.board);

      if (Math.abs(materialDifference) < 1) {
        return 'draw';
      }

      if (playerOutOfTime === 'white') {
        return materialDifference > 3 ? 'white' : 'black';
      } else {
        return materialDifference < -3 ? 'black' : 'white';
      }
    },

    evaluateMaterialDifference(board: ChessBoard): number {
      const pieceValues = {
        pawn: 1,
        knight: 3,
        bishop: 3,
        rook: 5,
        queen: 9,
        king: 0,
      };

      let whiteMaterial = 0;
      let blackMaterial = 0;

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece) {
            const value = pieceValues[piece.type];
            if (piece.color === 'white') {
              whiteMaterial += value;
            } else {
              blackMaterial += value;
            }
          }
        }
      }

      return whiteMaterial - blackMaterial;
    },

    async updatePlayerRatings(winner: 'white' | 'black' | 'draw') {
      const gameStore = useGameStore();
      if (!gameStore.currentGame) return;

      const userStore = useUserStore();
      const whitePlayer = userStore.usersList.find((user) => user._id === gameStore.currentGame?.players.white);
      const blackPlayer = userStore.usersList.find((user) => user._id === gameStore.currentGame?.players.black);
      if (!whitePlayer || !blackPlayer) {
        console.error('Unable to find players');
        return;
      }

      const K = 32; // Коэффициент изменения рейтинга
      const expectedScoreWhite = 1 / (1 + Math.pow(10, (blackPlayer.rating - whitePlayer.rating) / 400));
      const expectedScoreBlack = 1 - expectedScoreWhite;

      let actualScoreWhite, actualScoreBlack;

      if (winner === 'white') {
        actualScoreWhite = 1;
        actualScoreBlack = 0;
        whitePlayer.stats.gamesWon++;
        blackPlayer.stats.gamesLost++;
      } else if (winner === 'black') {
        actualScoreWhite = 0;
        actualScoreBlack = 1;
        whitePlayer.stats.gamesLost++;
        blackPlayer.stats.gamesWon++;
      } else {
        actualScoreWhite = 0.5;
        actualScoreBlack = 0.5;
        whitePlayer.stats.gamesDraw++;
        blackPlayer.stats.gamesDraw++;
      }

      const whiteRatingChange = Math.round(K * (actualScoreWhite - expectedScoreWhite));
      const blackRatingChange = Math.round(K * (actualScoreBlack - expectedScoreBlack));

      whitePlayer.rating += whiteRatingChange;
      blackPlayer.rating += blackRatingChange;

      whitePlayer.stats.gamesPlayed++;
      blackPlayer.stats.gamesPlayed++;

      whitePlayer.stats.averageRatingChange =
        (whitePlayer.stats.averageRatingChange * (whitePlayer.stats.gamesPlayed - 1) + whiteRatingChange) /
        whitePlayer.stats.gamesPlayed;
      blackPlayer.stats.averageRatingChange =
        (blackPlayer.stats.averageRatingChange * (blackPlayer.stats.gamesPlayed - 1) + blackRatingChange) /
        blackPlayer.stats.gamesPlayed;

      whitePlayer.stats.biggestRatingGain = Math.max(whitePlayer.stats.biggestRatingGain, whiteRatingChange);
      whitePlayer.stats.biggestRatingLoss = Math.min(whitePlayer.stats.biggestRatingLoss, whiteRatingChange);
      blackPlayer.stats.biggestRatingGain = Math.max(blackPlayer.stats.biggestRatingGain, blackRatingChange);
      blackPlayer.stats.biggestRatingLoss = Math.min(blackPlayer.stats.biggestRatingLoss, blackRatingChange);

      whitePlayer.winRate = whitePlayer.stats.gamesWon / whitePlayer.stats.gamesPlayed;
      blackPlayer.winRate = blackPlayer.stats.gamesWon / blackPlayer.stats.gamesPlayed;

      // Обновляем титулы
      whitePlayer.title = getTitleForRating(whitePlayer.rating);
      blackPlayer.title = getTitleForRating(blackPlayer.rating);

      // Обновляем данные игроков в базе данных
      await userStore.updateUser(whitePlayer);
      await userStore.updateUser(blackPlayer);
    },
  },
});
