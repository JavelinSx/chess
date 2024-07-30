// features/game-logic/model/game.store.ts

import { defineStore } from 'pinia';
import type { ChessGame } from '~/entities/game/model/game.model';
import { gameApi } from '~/shared/api/game';

export const useGameStore = defineStore('game', {
  state: () => ({
    currentGame: null as ChessGame | null,
  }),
  actions: {
    async fetchGame(gameId: string) {
      const response = await gameApi.getGame(gameId);
      if (response.data) {
        this.currentGame = response.data;
        console.log('Fetched game:', this.currentGame); // Добавим лог
      } else if (response.error) {
        console.error('Failed to fetch game:', response.error);
        throw new Error(response.error);
      }
    },
    updateGameState(game: ChessGame) {
      this.currentGame = game;
      console.log('Updated game state:', this.currentGame); // Добавим лог
    },
    async makeMove(from: [number, number], to: [number, number]) {
      if (!this.currentGame) {
        throw new Error('No active game');
      }

      const response = await gameApi.makeMove(this.currentGame.id, from, to);
      if (response.data) {
        this.currentGame = response.data;
      } else if (response.error) {
        console.error('Failed to make move:', response.error);
        throw new Error(response.error);
      }
    },
  },
});
