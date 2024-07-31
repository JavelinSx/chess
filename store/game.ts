// store/game.ts
import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';
import type { ChessGame } from '~/entities/game/model/game.model';
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
          console.log('Fetched game:', this.currentGame);
        } else if (response.error) {
          this.error = response.error;
          console.error('Failed to fetch game:', response.error);
        }
      } catch (error) {
        console.error('Failed to fetch game:', error);
        this.error = 'Failed to fetch game';
      }
    },

    updateGameState(game: ChessGame) {
      this.currentGame = game;
      console.log('Updated game state:', this.currentGame);
    },

    async makeMove(from: [number, number], to: [number, number]) {
      if (!this.currentGame) {
        throw new Error('No active game');
      }

      try {
        const response = await gameApi.makeMove(this.currentGame.id, from, to);
        if (response.data) {
          this.currentGame = response.data;
        } else if (response.error) {
          this.error = response.error;
          console.error('Failed to make move:', response.error);
        }
      } catch (error) {
        console.error('Failed to make move:', error);
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
        const router = useRouter();
        router.push('/');
      } catch (error) {
        console.error('Failed to forfeit game:', error);
        this.error = 'Failed to forfeit game';
      }
    },

    handleGameEnd(data: { gameId: string; winner: string; loser: string; reason: string }) {
      if (this.currentGame && this.currentGame.id === data.gameId) {
        this.currentGame = null;
        // Обновляем статус пользователя
        const userStore = useUserStore();
        userStore.updateUserStatus(false, false);
        // Показываем уведомление о завершении игры
        alert(`Game ended. ${data.reason === 'forfeit' ? 'Your opponent forfeited.' : `Winner: ${data.winner}`}`);
        // Перенаправляем на главную страницу
        navigateTo('/');
      }
    },

    resetError() {
      this.error = null;
    },
  },

  persist: {
    storage: persistedState.localStorage,
    paths: ['currentGame'],
  },
});
