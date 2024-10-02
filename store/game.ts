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
      if (this.currentGame) {
        Object.assign(this.currentGame, reactive(game));
      } else {
        this.currentGame = reactive(game);
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
        const response = await gameApi.makeMove(this.currentGame.id, from, to);
        if (response.data) {
          this.currentGame = response.data;
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = this.locales.t('failedToMakeMove');
      }
    },

    handleSSEUpdate(updatedGame: ChessGame) {
      if (this.currentGame && this.currentGame.id === updatedGame.id) {
        this.currentGame = updatedGame;

        if (updatedGame.status === 'completed') {
          this.handleGameEnd(updatedGame.result);
        }
      }
    },

    async handleGameEnd(result: GameResult) {
      this.gameResult = result;
      this.showResultModal = true;

      const userStore = useUserStore();
      if (userStore.user && this.currentGame) {
        try {
          const updatedStats = await gameApi.updateGameStats(this.currentGame.id, result);
          if (updatedStats.data) {
            const currentUserStats = updatedStats.data[userStore.user._id];
            if (currentUserStats) {
              userStore.updateUserStats(currentUserStats);
            }
          }
        } catch (error) {
          console.error('Failed to update game stats:', error);
        }
      }
      this.currentGame = null;
    },

    async promotePawn(promoteTo: PieceType) {
      if (!this.currentGame || !this.pendingPromotion) {
        throw new Error(this.locales.t('noPendingPromotion'));
      }

      const { from, to } = this.pendingPromotion;

      try {
        const response = await gameApi.makeMove(this.currentGame.id, from, to, promoteTo);
        if (response.data) {
          this.currentGame = response.data;
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
