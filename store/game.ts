import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';
import { useUserStore } from './user';
import type { ChessGame, Position, PieceType, GameResult, GameDuration } from '~/server/types/game';
import { useGameTimerStore } from './gameTimer';
export type GameEndReason = 'checkmate' | 'stalemate' | 'draw' | 'forfeit' | 'timeout';

export interface GameStore {
  currentGame: ChessGame | null;
  gameDuration: GameDuration;
  isLoading: boolean;
  promote: boolean;
  pendingPromotion: { from: Position; to: Position } | null;
  showResultModal: boolean;
  gameResult: GameResult | null;
  gameEndReason: Promise<GameResult> | null;
  error: string | null;
  isProcessingGameEnd: boolean;
  makeMove(from: Position, to: Position): Promise<{ success: boolean }>;
  promotePawn(promoteTo: PieceType): Promise<void>;
  handleGameEnd(result: GameResult): Promise<void>;
}

export const useGameStore = defineStore('game', {
  state: () => ({
    // Game State
    currentGame: null as ChessGame | null,
    gameDuration: 30 as GameDuration,
    isLoading: false,
    // Promotion State
    promote: false,
    pendingPromotion: null as { from: Position; to: Position } | null,
    // Result State
    showResultModal: false,
    gameResult: null as GameResult | null,
    gameEndReason: null as Promise<GameResult> | null,
    // Error Handling
    error: null as string | null,
    // State
    isProcessingGameEnd: false,
  }),

  actions: {
    // Core Game Actions
    async fetchGame(gameId: string) {
      try {
        const response = await gameApi.getGame(gameId);
        if (response.data) {
          this.currentGame = response.data;
          this.gameResult = null;
          this.showResultModal = false;
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = this.getLocaleErrorMessage('failedToFetchGame');
        this.currentGame = null;
      }
    },

    updateGameState(game: ChessGame) {
      this.currentGame = { ...game };
    },

    async makeMove(from: Position, to: Position) {
      if (!this.currentGame) throw new Error((this.error = this.getLocaleErrorMessage('noActiveGame')));

      const userStore = useUserStore();
      const timerStore = useGameTimerStore();
      const userId = userStore.user?._id;

      if (!userId) {
        throw new Error((this.error = this.getLocaleErrorMessage('userNotAuthenticated')));
      }

      try {
        await gameApi.makeMove(this.currentGame._id, from, to, timerStore.whiteTime, timerStore.blackTime);
        return { success: true };
      } catch (error) {
        this.error = this.getLocaleErrorMessage('failedToMakeMove');
        return { success: false };
      }
    },

    // Pawn Promotion Actions
    async promotePawn(promoteTo: PieceType) {
      const timerStore = useGameTimerStore();
      if (!this.currentGame || !this.pendingPromotion) {
        throw new Error(this.getLocaleErrorMessage('noPendingPromotion'));
      }

      const { from, to } = this.pendingPromotion;

      try {
        await gameApi.makeMove(this.currentGame._id, from, to, timerStore.whiteTime, timerStore.blackTime, promoteTo);
      } catch (error) {
        this.error = this.getLocaleErrorMessage('failedToPromotePawn');
      } finally {
        this.pendingPromotion = null;
        this.promote = false;
      }
    },

    // Обработка окончания игры
    async handleGameEnd(result: GameResult, fromSSE: boolean = false) {
      if (!this.currentGame) return;

      try {
        if (!fromSSE) {
          // Только для прямого действия игрока
          const response = await gameApi.endGame(this.currentGame._id, result);
          if (response.data) {
            this.gameResult = response.data;
            this.showResultModal = true;
          }
        } else {
          // Для SSE обновления
          this.gameResult = result;
          this.showResultModal = true;
        }
        setTimeout(() => this.clearGameState(), 10000);
      } catch (error) {
        console.error('Error ending game:', error);
        this.error = 'Failed to end game';
      } finally {
        this.isProcessingGameEnd = false;
      }
    },

    // Time Control Actions
    setGameDuration(duration: GameDuration) {
      this.gameDuration = duration;
    },

    // State Management Actions
    clearGameState() {
      // Очищаем state
      this.currentGame = null;
      this.error = null;
      this.promote = false;
      this.pendingPromotion = null;
      this.isLoading = false;

      // Очищаем persist storage Pinia
      this.$reset();
      navigateTo('/');
    },

    closeGameResult() {
      this.showResultModal = false;
      this.gameResult = null;
    },

    // Real-time Update Actions
    handleSSEUpdate(updatedGame: ChessGame) {
      if (this.currentGame && this.currentGame._id === updatedGame._id) {
        this.currentGame = updatedGame;
      }
    },

    // Error Handling Actions
    resetError() {
      this.error = null;
    },

    getLocaleErrorMessage(key: string) {
      const { t } = useI18n();
      return t(key);
    },
  },

  persist: {
    storage: persistedState.localStorage,
  },
});
