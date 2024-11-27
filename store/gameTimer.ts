import { defineStore } from 'pinia';
import { useGameStore } from './game';
import type { GameDuration, GameResultReason } from '~/server/types/game';

interface TimerState {
  whiteTime: number;
  blackTime: number;
  activeColor: 'white' | 'black' | null;
  status: 'countdown' | 'not_started' | 'active' | 'completed';
  initialTime: GameDuration | null;
  lastUpdateTime: number;
  countdownTime: number;
  initCountdown: boolean;
  init: boolean;
}

export const useGameTimerStore = defineStore('gameTimer', {
  state: (): TimerState => ({
    whiteTime: 0,
    blackTime: 0,
    activeColor: null,
    status: 'not_started',
    initialTime: null,
    lastUpdateTime: 0,
    countdownTime: 5,
    initCountdown: false,
    init: false,
  }),

  getters: {
    remainingTime: (state) => (color: 'white' | 'black') => {
      return color === 'white' ? state.whiteTime : state.blackTime;
    },
    isGameReady: (state) => state.status === 'active',
    isCountingDown: (state) => state.status === 'countdown',
  },

  actions: {
    initializeTimer(duration: GameDuration) {
      if (!this.init) {
        const timeInSeconds = duration * 60;
        this.whiteTime = timeInSeconds + 5;
        this.blackTime = timeInSeconds;
        this.initialTime = duration;
        this.status = 'countdown';
        this.activeColor = 'white';
        this.lastUpdateTime = Date.now();
        this.countdownTime = 5;
        this.init = true;
      }
    },

    startCountdown() {
      this.status = 'countdown';
      this.initCountdown = true;
      const timer = setInterval(() => {
        this.countdownTime--;
        if (this.countdownTime <= 0) {
          clearInterval(timer);
          this.status = 'active';
          this.initCountdown = false;
        }
      }, 1000);
    },

    syncTimerState(timerData: {
      whiteTime: number;
      blackTime: number;
      activeColor: 'white' | 'black';
      lastUpdateTime: number;
    }) {
      this.whiteTime = timerData.whiteTime;
      this.blackTime = timerData.blackTime;
      this.activeColor = timerData.activeColor;
      this.lastUpdateTime = timerData.lastUpdateTime;
    },

    updateTimerAfterMove() {
      const gameStore = useGameStore();
      if (!gameStore.currentGame) return;

      this.activeColor = gameStore.currentGame.currentTurn;
      this.lastUpdateTime = Date.now();
    },

    handleTimeOut(color: 'white' | 'black') {
      this.status = 'completed';
      const gameStore = useGameStore();

      if (gameStore.currentGame) {
        const result = {
          winner: gameStore.currentGame.players[color === 'white' ? 'black' : 'white']!._id,
          loser: gameStore.currentGame.players[color]!._id,
          reason: 'timeout' as GameResultReason,
        };
        gameStore.handleGameEnd(result);
        this.resetTimer();
      }
    },

    updateTimeAndSync() {
      if (this.status !== 'active' || !this.activeColor) return;

      const currentTime = Date.now();
      const elapsed = (currentTime - this.lastUpdateTime) / 1000;

      // Обновляем время активного игрока
      if (this.activeColor === 'white') {
        this.whiteTime = Math.max(0, this.whiteTime - elapsed);
        if (this.whiteTime === 0) {
          this.handleTimeOut('white');
          return;
        }
      } else {
        this.blackTime = Math.max(0, this.blackTime - elapsed);
        if (this.blackTime === 0) {
          this.handleTimeOut('black');
          return;
        }
      }

      this.lastUpdateTime = currentTime;
    },

    updateTimeAfterMove() {
      const gameStore = useGameStore();
      if (!gameStore.currentGame || this.status !== 'active') return;

      // Обновляем активный цвет
      this.activeColor = gameStore.currentGame.currentTurn;
      this.lastUpdateTime = Date.now();

      // Отправляем синхронизацию через SSE
      const timerData = {
        whiteTime: this.whiteTime,
        blackTime: this.blackTime,
        activeColor: this.activeColor,
        lastUpdateTime: this.lastUpdateTime,
      };

      // Отправляем событие синхронизации
      window.dispatchEvent(
        new CustomEvent('timer-sync', {
          detail: timerData,
        })
      );
    },

    resetTimer() {
      this.whiteTime = 0;
      this.blackTime = 0;
      this.activeColor = null;
      this.status = 'not_started';
      this.initialTime = null;
      this.lastUpdateTime = 0;
      this.countdownTime = 5;
      this.init = false;
      this.$reset();
    },
  },

  persist: {
    storage: persistedState.localStorage,
  },
});
