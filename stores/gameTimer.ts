// store/gameTimer.ts
import { defineStore } from 'pinia';
import { useGameStore } from './game';
import type { GameDuration, PieceColor } from '~/server/types/game';

interface TimerState {
  whiteTime: number;
  blackTime: number;
  activeColor: PieceColor | null;
  status: 'countdown' | 'not_started' | 'active' | 'completed';
  lastUpdateTime: number;
  countdownTime: number;
  initialDuration: number | null;
  gameId: string | null; // Добавляем ID игры для идентификации
  lastSyncTime: number; // Добавляем время последней синхронизации
  localInterval: NodeJS.Timeout | null; // Для локальных обновлений
  isCountingStarted: boolean;
}

export const useGameTimerStore = defineStore('gameTimer', {
  state: (): TimerState => ({
    whiteTime: 0,
    blackTime: 0,
    activeColor: null,
    status: 'not_started',
    lastUpdateTime: 0,
    countdownTime: 5,
    initialDuration: null,
    gameId: null,
    lastSyncTime: 0,
    localInterval: null,
    isCountingStarted: false,
  }),

  getters: {
    remainingTime: (state) => (color: PieceColor) => {
      return color === 'white' ? state.whiteTime : state.blackTime;
    },
    isGameReady: (state) => state.status === 'active',
    isCountingDown: (state) => state.status === 'countdown',
  },

  actions: {
    async initialize(gameId: string, duration?: GameDuration) {
      // Сбрасываем счетчик при новой инициализации
      this.countdownTime = 5;
      this.isCountingStarted = false;

      // Проверяем, не та же ли это игра после перезагрузки
      if (this.gameId === gameId && this.status === 'active') {
        return;
      }

      this.gameId = gameId;

      if (duration) {
        // Новая игра
        const timeInSeconds = duration * 60;
        this.whiteTime = timeInSeconds;
        this.blackTime = timeInSeconds;
        this.initialDuration = timeInSeconds;
        this.activeColor = 'white';
        this.status = 'countdown';
        this.lastUpdateTime = Date.now();
      } else if (this.status === 'active') {
        this.startLocalTimer();
      } else {
        // После перезагрузки ждем синхронизации через SSE
        this.status = 'not_started';
      }
    },

    startCountdown() {
      if (this.isCountingStarted || this.status !== 'countdown') return;

      this.isCountingStarted = true;
      const countdownInterval = setInterval(() => {
        this.countdownTime--;
        if (this.countdownTime <= 0) {
          clearInterval(countdownInterval);
          this.status = 'active';
          this.startLocalTimer(); // Запускаем таймер после обратного отсчета
        }
      }, 1000);
    },

    handleTimerSync(timerData: {
      whiteTime: number;
      blackTime: number;
      activeColor: PieceColor;
      gameId: string;
      status: 'countdown' | 'active' | 'completed';
    }) {
      // Проверяем, что синхронизация для текущей игры
      if (timerData.gameId !== this.gameId) return;

      this.whiteTime = timerData.whiteTime;
      this.blackTime = timerData.blackTime;
      this.activeColor = timerData.activeColor;
      this.lastUpdateTime = Date.now();

      // Обновляем статус только если он изменился
      if (this.status !== timerData.status) {
        this.status = timerData.status;
      }
    },

    // Обработка временного разрыва после переподключения
    handleReconnection(lastUpdateTime: number) {
      if (!this.activeColor || this.status !== 'active') return;

      const timeDiff = (Date.now() - lastUpdateTime) / 1000;

      if (this.activeColor === 'white') {
        this.whiteTime = Math.max(0, this.whiteTime - timeDiff);
        if (this.whiteTime <= 0) {
          this.handleTimeout('white');
        }
      } else {
        this.blackTime = Math.max(0, this.blackTime - timeDiff);
        if (this.blackTime <= 0) {
          this.handleTimeout('black');
        }
      }
    },

    updateActiveColor(color: PieceColor) {
      if (this.activeColor !== color) {
        this.activeColor = color;
        this.lastUpdateTime = Date.now();
      }
    },

    handleTimeout(color: PieceColor) {
      if (this.status === 'completed') return;

      this.status = 'completed';
      const gameStore = useGameStore();

      if (gameStore.currentGame && gameStore.currentGame._id === this.gameId) {
        const winner = gameStore.currentGame.players[color === 'white' ? 'black' : 'white']!;
        const loser = gameStore.currentGame.players[color]!;

        gameStore.handleGameEnd({
          winner: {
            _id: winner._id,
            username: winner.username,
            avatar: winner.avatar || '',
          },
          loser: {
            _id: loser._id,
            username: loser.username,
            avatar: loser.avatar || '',
          },
          reason: 'timeout',
        });
      }
    },

    startLocalTimer() {
      if (this.localInterval) {
        clearInterval(this.localInterval);
      }

      this.localInterval = setInterval(() => {
        if (this.status !== 'active' || !this.activeColor) {
          return;
        }

        const now = Date.now();
        const elapsed = (now - this.lastUpdateTime) / 1000;

        if (this.activeColor === 'white') {
          this.whiteTime = Math.max(0, this.whiteTime - elapsed);
          if (this.whiteTime <= 0) {
            this.handleTimeout('white');
            return;
          }
        } else {
          this.blackTime = Math.max(0, this.blackTime - elapsed);
          if (this.blackTime <= 0) {
            this.handleTimeout('black');
            return;
          }
        }

        this.lastUpdateTime = now;
      }, 1000);
    },

    // Остановка локального интервала
    stopLocalTimer() {
      if (this.localInterval) {
        clearInterval(this.localInterval);
        this.localInterval = null;
      }
    },

    // Обработка SSE обновлений
    handleSSEUpdate(data: {
      whiteTime: number;
      blackTime: number;
      activeColor: PieceColor;
      gameId: string;
      status: 'countdown' | 'active' | 'completed';
      timestamp: number;
    }) {
      if (data.gameId !== this.gameId) return;
      if (data.status === 'countdown' && !this.isCountingStarted) {
        this.startCountdown();
        return;
      }

      // Проверяем, что обновление более свежее
      if (data.timestamp <= this.lastSyncTime) return;

      this.whiteTime = data.whiteTime;
      this.blackTime = data.blackTime;
      this.activeColor = data.activeColor;
      this.status = data.status;
      this.lastSyncTime = data.timestamp;
      this.lastUpdateTime = Date.now();

      // Перезапускаем локальный таймер для плавных обновлений
      if (this.status === 'active') {
        this.restartLocalTimer();
      }
    },

    // Перезапуск локального таймера
    restartLocalTimer() {
      this.stopLocalTimer();
      this.startLocalTimer();
    },

    // Обработка изменений в игре
    handleGameUpdate(gameStatus: string) {
      if (gameStatus === 'completed') {
        this.stopLocalTimer();
        this.status = 'completed';
      }
    },

    // Очистка при размонтировании
    cleanup() {
      this.stopLocalTimer();
      if (this.status !== 'active') {
        this.resetTimer();
      }
    },

    resetTimer() {
      this.stopLocalTimer();
      this.isCountingStarted = false;
      this.$reset();
    },
  },

  persist: {
    storage: persistedState.localStorage,
    paths: [
      'whiteTime',
      'blackTime',
      'activeColor',
      'status',
      'gameId',
      'initialDuration',
      'lastSyncTime',
      'countdownTime',
      'isCountingStarted',
    ],
  },
});
