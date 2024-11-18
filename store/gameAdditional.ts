// store/gameAdditional.ts
import { defineStore } from 'pinia';
import { useGameStore } from './game';
import type { ChessBoard, GameResult, PieceColor } from '~/server/types/game';

export const useGameAdditionalStore = defineStore('gameAdditional', {
  state: () => ({
    whiteTimeRemaining: 0,
    blackTimeRemaining: 0,
    activeTimer: null as PieceColor | null,
    lastUpdateTime: 0,
    gameStatus: 'not_started' as 'not_started' | 'active' | 'completed',
    isInitialized: false,
    gameId: null as string | null,
  }),

  getters: {
    currentTurn(): 'white' | 'black' | null {
      const gameStore = useGameStore();
      return gameStore.currentGame?.currentTurn || null;
    },
    getTimeRemaining: (state) => (color: PieceColor) => {
      return color === 'white' ? state.whiteTimeRemaining : state.blackTimeRemaining;
    },
  },

  actions: {
    initializeGameTime() {
      const gameStore = useGameStore();
      const currentGame = gameStore.currentGame;

      // Проверяем наличие игры и тип контроля времени
      if (!currentGame || currentGame.timeControl?.type !== 'timed') return;

      // Проверяем, не та же ли это игра
      if (this.gameId && currentGame._id && this.gameId === currentGame._id && this.isInitialized) {
        this.recalculateTimeAfterReload();
        return;
      }

      // Новая игра - инициализируем заново
      const totalMinutes = currentGame.timeControl?.initialTime || 30;
      const timePerPlayer = (totalMinutes * 60) / 2;

      this.whiteTimeRemaining = timePerPlayer;
      this.blackTimeRemaining = timePerPlayer;
      this.lastUpdateTime = Date.now();
      this.gameStatus = 'active';

      // Проверяем наличие currentTurn перед присвоением
      if (currentGame.currentTurn) {
        this.activeTimer = currentGame.currentTurn;
      } else {
        this.activeTimer = 'white'; // Значение по умолчанию
      }

      this.isInitialized = true;
      this.gameId = currentGame._id;
    },

    updateGameTime() {
      if (this.gameStatus === 'active' && this.activeTimer) {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.lastUpdateTime) / 1000;
        if (this.activeTimer === 'white') {
          this.whiteTimeRemaining = Math.max(0, this.whiteTimeRemaining - elapsedTime);
          if (this.whiteTimeRemaining === 0) {
            this.handleTimeUp('white');
          }
        } else {
          this.blackTimeRemaining = Math.max(0, this.blackTimeRemaining - elapsedTime);
          if (this.blackTimeRemaining === 0) {
            this.handleTimeUp('black');
          }
        }
        this.lastUpdateTime = currentTime;
      }
    },

    switchTimer() {
      if (this.gameStatus === 'active') {
        this.updateGameTime(); // Обновляем время перед переключением
        this.activeTimer = this.activeTimer === 'white' ? 'black' : 'white';
        this.lastUpdateTime = Date.now(); // Сбрасываем время последнего обновления
      }
    },

    handleTimeUp(playerColor: PieceColor) {
      this.gameStatus = 'completed';
      const gameStore = useGameStore();
      const whitePlayer = gameStore.currentGame?.players.white;
      const blackPlayer = gameStore.currentGame?.players.black;
      if (whitePlayer && blackPlayer) {
        const result: GameResult = {
          winner: playerColor === 'white' ? blackPlayer : whitePlayer,
          loser: playerColor === 'white' ? whitePlayer : blackPlayer,
          reason: 'timeout',
        };
        gameStore.handleGameEnd(result);
      }
    },

    pauseTimer() {
      if (this.gameStatus === 'active') {
        this.updateGameTime(); // Последнее обновление перед паузой
        this.gameStatus = 'not_started';
      }
    },

    resumeTimer() {
      if (this.gameStatus === 'not_started') {
        this.lastUpdateTime = Date.now();
        this.gameStatus = 'active';
      }
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
    recalculateTimeAfterReload() {
      if (!this.lastUpdateTime || !this.activeTimer) return;

      const currentTime = Date.now();
      const elapsedTime = (currentTime - this.lastUpdateTime) / 1000;

      // Обновляем только активный таймер
      if (this.activeTimer === 'white') {
        this.whiteTimeRemaining = Math.max(0, this.whiteTimeRemaining - elapsedTime);
        if (this.whiteTimeRemaining <= 0) {
          this.handleTimeUp('white');
        }
      } else {
        this.blackTimeRemaining = Math.max(0, this.blackTimeRemaining - elapsedTime);
        if (this.blackTimeRemaining <= 0) {
          this.handleTimeUp('black');
        }
      }

      this.lastUpdateTime = currentTime;
    },
    resetGame() {
      this.whiteTimeRemaining = 0;
      this.blackTimeRemaining = 0;
      this.activeTimer = null;
      this.lastUpdateTime = 0;
      this.gameStatus = 'not_started';
      this.isInitialized = false;
      this.gameId = null;
    },
  },
  persist: {
    storage: persistedState.localStorage,
    paths: [
      'whiteTimeRemaining',
      'blackTimeRemaining',
      'activeTimer',
      'lastUpdateTime',
      'gameStatus',
      'isInitialized',
      'gameId',
    ],
  },
});
