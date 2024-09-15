import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';
import type { ChessGame, Position, PieceType } from '~/server/types/game';
import { promotePawn } from '~/features/game-logic/model/game-logic/special-moves';
import { useUserStore } from './user';

export const useGameStore = defineStore('game', {
  state: () => ({
    currentGame: null as ChessGame | null,
    error: null as string | null,
    promote: false,
    pendingPromotion: null as { from: Position; to: Position } | null,
    locales: useI18n(),
  }),

  actions: {
    async fetchGame(gameId: string) {
      try {
        const response = await gameApi.getGame(gameId);
        if (response.data) {
          this.currentGame = response.data;
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = this.locales.t('failedToFetchGame');
        this.currentGame = null;
      }
    },

    updateGameState(game: ChessGame) {
      if (this.currentGame) {
        Object.assign(this.currentGame, reactive(game));
      } else {
        this.currentGame = reactive(game);
      }
    },

    async makeMove(from: Position, to: Position) {
      if (!this.currentGame) throw new Error(this.locales.t('noActiveGame'));

      try {
        const response = await gameApi.makeMove(this.currentGame.id, from, to);

        if (response.data) {
          this.currentGame = response.data;
        } else if (response.error) {
          console.error(this.locales.t('errorMakingMove'), response.error);
          this.error = response.error;
        }
      } catch (error) {
        console.error(this.locales.t('failedToMakeMove'), error);
        this.error = this.locales.t('failedToMakeMove');
      }
    },

    async promotePawn(promoteTo: PieceType) {
      if (!this.currentGame || !this.pendingPromotion) {
        throw new Error(this.locales.t('noPendingPromotion'));
      }

      const { from, to } = this.pendingPromotion;
      const updatedGame = promotePawn(this.currentGame, from, to, promoteTo);

      try {
        const response = await gameApi.makeMove(this.currentGame.id, from, to, promoteTo);
        if (response.data) {
          const mergedGame = {
            ...response.data,
            board: updatedGame.board,
          };
          this.currentGame = mergedGame;
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = this.locales.t('failedToPromotePawn');
      } finally {
        this.pendingPromotion = null;
        this.promote = false;
      }
    },

    isPawnPromotion(from: Position, to: Position): boolean {
      if (!this.currentGame) return false;

      const [fromRow, fromCol] = from;
      const [toRow, toCol] = to;
      const piece = this.currentGame.board[fromRow][fromCol];

      if (piece?.type !== 'pawn') return false;

      return (piece.color === 'white' && toRow === 7) || (piece.color === 'black' && toRow === 0);
    },

    async forcedEndGame() {
      if (!this.currentGame) {
        throw new Error(this.locales.t('noActiveGame'));
      }

      try {
        await gameApi.forcedEndGame(this.currentGame.id);
        this.currentGame = null;
        const userStore = useUserStore();
        await userStore.updateUserStatus(false, false);
        navigateTo('/');
      } catch (error) {
        console.error(this.locales.t('failedToForfeitGame'), error);
        this.error = this.locales.t('failedToForfeitGame');
      }
    },

    handleGameUpdate(updatedGame: ChessGame) {
      this.currentGame = updatedGame;
    },

    handleGameEnd(result: any) {
      this.currentGame = null;
      // Здесь можно добавить логику для отображения результата игры
      // например, показать модальное окно с результатом
    },
    resetError() {
      this.error = null;
    },
  },
  persist: {
    storage: persistedState.localStorage,
  },
});
