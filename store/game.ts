import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';
import type { ChessGame } from '~/entities/game/model/game.model';
import type { Position } from '~/features/game-logic/model/pieces/types';
import type { PieceType } from '~/entities/game/model/board.model';
import { promotePawn } from '~/features/game-logic/model/game-logic/special-moves';
import { useUserStore } from './user';

export const useGameStore = defineStore('game', {
  state: () => ({
    currentGame: null as ChessGame | null,
    error: null as string | null,
    promote: false,
    pendingPromotion: null as { from: Position; to: Position } | null,
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

      if (this.isPawnPromotion(from, to)) {
        this.pendingPromotion = { from, to };
        this.promote = true;
        return;
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

    async promotePawn(promoteTo: PieceType) {
      if (!this.currentGame || !this.pendingPromotion) {
        throw new Error('No pending promotion');
      }

      const { from, to } = this.pendingPromotion;
      const updatedGame = promotePawn(this.currentGame, from, to, promoteTo);

      try {
        const response = await gameApi.makeMove(this.currentGame.id, from, to, promoteTo);
        if (response.data) {
          // Применяем локальные изменения к ответу сервера
          const mergedGame = {
            ...response.data,
            board: updatedGame.board,
          };
          this.currentGame = mergedGame;
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = 'Failed to promote pawn';
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
