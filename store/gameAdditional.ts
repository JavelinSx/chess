// store/gameAdditional.ts
import { defineStore } from 'pinia';
import { useGameStore } from './game';
import type { ChessBoard, GameResult } from '~/server/types/game';

export const useGameAdditionalStore = defineStore('gameAdditional', {
  state: () => ({
    gameDuration: 30 * 60,
    timeRemaining: 30 * 60,
    gameStartTime: 0,
    lastUpdateTime: 0,
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
      this.gameDuration = duration * 60;
      this.timeRemaining = this.gameDuration;
    },

    initializeGameTime() {
      const gameStore = useGameStore();
      if (gameStore.currentGame && gameStore.currentGame.timeControl?.type === 'timed') {
        const startTime = gameStore.currentGame.startedAt
          ? new Date(gameStore.currentGame.startedAt).getTime()
          : Date.now();
        const currentTime = Date.now();
        const elapsedTime = (currentTime - startTime) / 1000; // в секундах

        this.gameDuration = gameStore.currentGame.timeControl.initialTime! * 60; // Преобразуем минуты в секунды
        this.timeRemaining = Math.max(0, this.gameDuration - elapsedTime);
        this.gameStartTime = startTime;
        this.lastUpdateTime = currentTime;
        this.gameStatus = 'active';
      }
    },

    updateGameTime() {
      if (this.gameStatus === 'active') {
        const currentTime = Date.now();
        const elapsedSinceLastUpdate = (currentTime - this.lastUpdateTime) / 1000; // в секундах
        this.timeRemaining = Math.max(0, this.timeRemaining - elapsedSinceLastUpdate);
        this.lastUpdateTime = currentTime;
        if (this.timeRemaining <= 0) {
          this.handleTimeUp();
        }
      }
    },

    handleTimeUp() {
      const gameStore = useGameStore();
      const game = gameStore.currentGame;
      if (!game) return;

      const result: GameResult = {
        winner: null,
        loser: null,
        reason: 'timeout',
      };
      this.gameStatus = 'completed';
      gameStore.handleGameEnd(result);
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
  },
});
