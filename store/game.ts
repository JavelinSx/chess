import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';
import type { ChessGame, Position, PieceType, GameResult, GameDuration } from '~/server/types/game';
import { useUserStore } from './user';
export type GameEndReason = 'checkmate' | 'stalemate' | 'draw' | 'forfeit' | 'timeout';
export const useGameStore = defineStore('game', {
  state: () => ({
    // Game State
    currentGame: null as ChessGame | null,
    gameDuration: 30,
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

    // Utils
    locales: useI18n(),

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
        this.error = this.locales.t('failedToFetchGame');
        this.currentGame = null;
      }
    },

    updateGameState(game: ChessGame) {
      this.currentGame = { ...game };
    },

    async makeMove(from: Position, to: Position) {
      if (!this.currentGame) throw new Error(this.locales.t('noActiveGame'));

      const userStore = useUserStore();
      const userId = userStore.user?._id;

      if (!userId) {
        throw new Error(this.locales.t('userNotAuthenticated'));
      }

      try {
        await gameApi.makeMove(this.currentGame._id, from, to);
        return { succes: true };
      } catch (error) {
        this.error = this.locales.t('failedToMakeMove');
      }
    },

    // Pawn Promotion Actions
    async promotePawn(promoteTo: PieceType) {
      if (!this.currentGame || !this.pendingPromotion) {
        throw new Error(this.locales.t('noPendingPromotion'));
      }

      const { from, to } = this.pendingPromotion;

      try {
        await gameApi.makeMove(this.currentGame._id, from, to, promoteTo);
      } catch (error) {
        this.error = this.locales.t('failedToPromotePawn');
      } finally {
        this.pendingPromotion = null;
        this.promote = false;
      }
    },

    // Обработка окончания игры
    async handleGameEnd(result: GameResult) {
      // Проверяем флаг перед выполнением
      if (this.isProcessingGameEnd || !this.currentGame) return;

      try {
        this.isProcessingGameEnd = true; // Устанавливаем флаг

        const response = await gameApi.endGame(this.currentGame._id, result);

        if (response.data) {
          this.gameResult = response.data;
          this.showResultModal = true;
          this.currentGame.status = 'completed'; // Явно устанавливаем статус
        }
      } catch (error) {
        console.error('Error ending game:', error);
        this.error = 'Failed to end game';
      } finally {
        this.isProcessingGameEnd = false; // Сбрасываем флаг
      }
    },

    // Time Control Actions
    setGameDuration(duration: number) {
      this.gameDuration = duration;
    },

    // State Management Actions
    clearGameState() {
      this.currentGame = null;
      this.error = null;
      this.promote = false;
      this.pendingPromotion = null;
      this.isLoading = false;
      localStorage.removeItem('game');
    },

    closeGameResult() {
      this.showResultModal = false;
      this.gameResult = null;
    },

    showGameResult(result: GameResult) {
      this.gameResult = result;
      this.showResultModal = true;
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
  },

  persist: {
    storage: persistedState.localStorage,
  },
});
