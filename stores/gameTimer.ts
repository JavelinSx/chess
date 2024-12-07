import { defineStore, type DefineStoreOptions } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import { useGameStore } from './game';
import type { GameDuration, PieceColor } from '~/server/types/game';

// Определяем типы для геттеров и экшенов
interface StoreGetters {
  remainingTime: (color: PieceColor) => number;
  isGameReady: boolean;
  isCountingDown: boolean;
}

interface StoreActions {
  initialize: (gameId: string, duration?: GameDuration) => Promise<void>;
  startCountdown: () => void;
  handleTimerSync: (timerData: any) => void;
  handleSSEUpdate: (data: any) => void;
  cleanup: () => void;
}

interface TimerState {
  whiteTime: number;
  blackTime: number;
  activeColor: PieceColor | null;
  status: 'countdown' | 'not_started' | 'active' | 'completed';
  lastUpdateTime: number;
  countdownTime: number;
  initialDuration: number | null;
  gameId: string | null;
  lastSyncTime: number;
  isCountingStarted: boolean;
}

export const useGameTimerStore = defineStore(
  'gameTimer',
  () => {
    const state = reactive<TimerState>({
      whiteTime: 0,
      blackTime: 0,
      activeColor: null,
      status: 'not_started',
      lastUpdateTime: 0,
      countdownTime: 5,
      initialDuration: null,
      gameId: null,
      lastSyncTime: 0,
      isCountingStarted: false,
    });

    // Локальные переменные
    let localInterval: NodeJS.Timeout | null = null;

    // Геттеры
    const remainingTime = (color: PieceColor) => {
      return color === 'white' ? state.whiteTime : state.blackTime;
    };

    const isGameReady = computed(() => state.status === 'active');
    const isCountingDown = computed(() => state.status === 'countdown');

    // Вспомогательные функции
    function stopLocalTimer() {
      if (localInterval) {
        clearInterval(localInterval);
        localInterval = null;
      }
    }

    function startLocalTimer() {
      stopLocalTimer();

      localInterval = setInterval(() => {
        if (state.status !== 'active' || !state.activeColor) {
          return;
        }

        const now = Date.now();
        const elapsed = (now - state.lastUpdateTime) / 1000;

        if (state.activeColor === 'white') {
          state.whiteTime = Math.max(0, state.whiteTime - elapsed);
          if (state.whiteTime <= 0) {
            handleTimeout('white');
            return;
          }
        } else {
          state.blackTime = Math.max(0, state.blackTime - elapsed);
          if (state.blackTime <= 0) {
            handleTimeout('black');
            return;
          }
        }

        state.lastUpdateTime = now;
      }, 1000);
    }

    // Основные действия
    function handleTimeout(color: PieceColor) {
      if (state.status === 'completed') return;

      state.status = 'completed';
      const gameStore = useGameStore();

      if (gameStore.currentGame && gameStore.currentGame._id === state.gameId) {
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
    }

    function startCountdown() {
      if (state.isCountingStarted || state.status !== 'countdown') return;

      state.isCountingStarted = true;
      const countdownInterval = setInterval(() => {
        state.countdownTime--;
        if (state.countdownTime <= 0) {
          clearInterval(countdownInterval);
          state.status = 'active';
          startLocalTimer();
        }
      }, 1000);
    }

    async function initialize(gameId: string, duration?: GameDuration) {
      state.countdownTime = 5;
      state.isCountingStarted = false;

      if (state.gameId === gameId && state.status === 'active') {
        return;
      }

      state.gameId = gameId;

      if (duration) {
        const timeInSeconds = duration * 60;
        state.whiteTime = timeInSeconds;
        state.blackTime = timeInSeconds;
        state.initialDuration = timeInSeconds;
        state.activeColor = 'white';
        state.status = 'countdown';
        state.lastUpdateTime = Date.now();
      } else if (state.status === 'active') {
        startLocalTimer();
      } else {
        state.status = 'not_started';
      }
    }

    function handleTimerSync(timerData: {
      whiteTime: number;
      blackTime: number;
      activeColor: PieceColor;
      gameId: string;
      status: 'countdown' | 'active' | 'completed';
    }) {
      if (timerData.gameId !== state.gameId) return;

      state.whiteTime = timerData.whiteTime;
      state.blackTime = timerData.blackTime;
      state.activeColor = timerData.activeColor;
      state.lastUpdateTime = Date.now();

      if (state.status !== timerData.status) {
        state.status = timerData.status;
      }
    }

    function handleSSEUpdate(data: {
      whiteTime: number;
      blackTime: number;
      activeColor: PieceColor;
      gameId: string;
      status: 'countdown' | 'active' | 'completed';
      timestamp: number;
    }) {
      if (data.gameId !== state.gameId) return;
      if (data.status === 'countdown' && !state.isCountingStarted) {
        startCountdown();
        return;
      }

      if (data.timestamp <= state.lastSyncTime) return;

      state.whiteTime = data.whiteTime;
      state.blackTime = data.blackTime;
      state.activeColor = data.activeColor;
      state.status = data.status;
      state.lastSyncTime = data.timestamp;
      state.lastUpdateTime = Date.now();

      if (state.status === 'active') {
        stopLocalTimer();
        startLocalTimer();
      }
    }

    function cleanup() {
      stopLocalTimer();
      if (state.status !== 'active') {
        state.whiteTime = 0;
        state.blackTime = 0;
        state.activeColor = null;
        state.status = 'not_started';
        state.lastUpdateTime = 0;
        state.countdownTime = 5;
        state.initialDuration = null;
        state.gameId = null;
        state.lastSyncTime = 0;
        state.isCountingStarted = false;
      }
    }

    return {
      ...toRefs(state),
      remainingTime,
      isGameReady,
      isCountingDown,
      initialize,
      startCountdown,
      handleTimerSync,
      handleSSEUpdate,
      cleanup,
    };
  },
  {
    persist: true,
  }
);
