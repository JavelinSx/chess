import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';
import type { ChessGame, Position, PieceType, GameResult, GameDuration } from '~/server/types/game';
import { useUserStore } from './user';

export const useGameStore = defineStore('game', {
  state: () => ({
    currentGame: null as ChessGame | null,
    error: null as string | null,
    promote: false,
    pendingPromotion: null as { from: Position; to: Position } | null,
    showResultModal: false,
    gameResult: null as GameResult | null,
    isLoading: false,
    gameDuration: 30,
    locales: useI18n(),
  }),

  actions: {
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
      if (game.status === 'completed' && game.result) {
        this.handleGameEnd(game.result);
      }
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

    handleSSEUpdate(updatedGame: ChessGame) {
      if (this.currentGame && this.currentGame._id === updatedGame._id) {
        this.currentGame = updatedGame;
      }
    },

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

    setGameDuration(duration: number) {
      this.gameDuration = duration;
    },

    async handleTimeUp(playerColor: 'white' | 'black') {
      if (!this.currentGame) return;

      const winner = playerColor === 'white' ? 'black' : 'white';
      const result: GameResult = {
        winner: this.currentGame.players[winner],
        loser: this.currentGame.players[playerColor],
        reason: 'timeout',
      };

      await this.handleGameEnd(result);
    },

    async sendGameInvitation(toInviteId: string) {
      const response = await gameApi.sendInvitation(toInviteId, this.gameDuration as GameDuration);
      if (response.error) {
        console.error(this.locales.t('failedToSendInvitation'), response.error);
      } else if (response.data && response.data.success) {
        console.log(this.locales.t('invitationSentSuccessfully'));
      }
    },

    async handleGameEnd(result: GameResult) {
      this.gameResult = result;
      this.showResultModal = true;

      if (this.currentGame) {
        try {
          const response = await gameApi.endGame(this.currentGame._id, result);
          if (response.error) {
            console.error('Failed to end game on server:', response.error);
          } else {
            if (response.data && 'ratingChanges' in response.data) {
              this.gameResult = { ...this.gameResult, ratingChanges: response.data.ratingChanges };
              this.clearGameState();
            }
          }
        } catch (error) {
          console.error('Error ending game:', error);
        }
      }
    },

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

    resetError() {
      this.error = null;
    },
  },
  persist: {
    storage: persistedState.localStorage,
  },
});
