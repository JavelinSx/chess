import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { Position } from '~/features/game-logic/model/pieces/types';
import { useUserStore } from './user';

export const useGameStore = defineStore('game', {
  state: () => ({
    currentGame: null as ChessGame | null,
    error: null as string | null,
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
      if (!this.currentGame) {
        throw new Error('No active game');
      }

      try {
        const response = await gameApi.makeMove(this.currentGame.id, from, to);
        if (response.data) {
          this.currentGame = response.data;
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = 'Failed to make move';
      }
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
    handleGameEnd(result: any) {
      this.currentGame = null;
      // Здесь можно добавить логику для отображения результата игры
      // например, показать модальное окно с результатом
    },
    resetError() {
      this.error = null;
    },
  },
});
