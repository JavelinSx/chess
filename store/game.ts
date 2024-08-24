import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { Position } from '~/features/game-logic/model/pieces/types';
import type { PieceType } from '~/entities/game/model/board.model';
import type { PendingPromotion } from '~/entities/game/model/game.model';
import { useUserStore } from './user';
import { isPawnPromotion } from '~/features/game-logic/model/game-logic/special-moves';

export const useGameStore = defineStore('game', {
  state: () => ({
    currentGame: null as ChessGame | null,
    error: null as string | null,
    pendingPromotion: null as PendingPromotion | null,
    promotion: {
      status: false,
      piece: null as PieceType | null,
      to: null as Position | null,
    },
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
        this.error = 'Failed to fetch game';
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
      if (!this.currentGame) throw new Error('No active game');

      if (isPawnPromotion(this.currentGame.board, from, to)) {
        this.promotion = {
          status: isPawnPromotion(this.currentGame.board, from, to),
          to: to,
          piece: null,
        };
      }

      try {
        const response = await gameApi.makeMove(this.currentGame.id, from, to);
        console.log('Move response:', response);

        if (response.data) {
          this.currentGame = response.data;
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        console.error('Failed to make move:', error);
        this.error = 'Failed to make move';
      }
    },
    handlePawnPromotionEvent(promotionData: PendingPromotion) {
      this.pendingPromotion = promotionData;
    },
    async forcedEndGame() {
      if (!this.currentGame) {
        throw new Error('No active game');
      }

      try {
        await gameApi.forcedEndGame(this.currentGame.id);
        this.currentGame = null;
        // Обновляем статус пользователя
        const userStore = useUserStore();
        await userStore.updateUserStatus(false, false);
        // Перенаправляем на главную страницу
        navigateTo('/');
      } catch (error) {
        console.error('Failed to forfeit game:', error);
        this.error = 'Failed to forfeit game';
      }
    },
    async sendPromotionChoice(to: Position, promoteTo: PieceType) {
      if (!this.currentGame || !this.currentGame.pendingPromotion) {
        throw new Error('No pending promotion');
      }

      try {
        const response = await gameApi.sendPromotionChoice(this.currentGame.id, to, promoteTo);
        if (response.data) {
          this.currentGame = response.data;
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = 'Failed to send promotion choice';
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
