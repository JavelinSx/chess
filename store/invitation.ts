// store/invitation.ts
import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';

type GameDuration = 15 | 30 | 45 | 90;

interface Invitation {
  fromInviteId: string;
  fromInviteName: string;
  gameDuration: GameDuration;
  expiresAt: number;
}
interface InfoInvitation {
  _id: string;
  username: string;
}

export const useInvitationStore = defineStore('invitation', {
  state: () => ({
    currentInvitation: null as Invitation | null,
    showDurationSelector: false,
    showInvitationModal: false,
    infoInvitation: null as InfoInvitation | null,
    timeRemaining: 15,
    locales: useI18n(),
    lastInviteTime: 0,
  }),

  getters: {
    progressValue: (state) => Math.round((state.timeRemaining / 15) * 100),
  },

  actions: {
    async showDurationSelectorFor(infoInvitation: InfoInvitation) {
      this.infoInvitation = {
        _id: infoInvitation._id,
        username: infoInvitation.username,
      };

      this.showDurationSelector = true;
    },

    closeDurationSelector() {
      this.showDurationSelector = false;
    },

    async sendGameInvitation(infoInvitation: InfoInvitation, gameDuration: GameDuration) {
      if (!infoInvitation) return false;
      try {
        const response = await gameApi.sendInvitation(infoInvitation._id, gameDuration);

        if (response.data?.success) {
          this.closeDurationSelector();
          return true;
        }
      } catch (error) {
        console.error('Failed to send invitation:', error);
      }
      return false;
    },

    handleGameInvitation(fromInviteId: string, fromInviteName: string, gameDuration: GameDuration) {
      this.currentInvitation = {
        fromInviteId,
        fromInviteName,
        gameDuration,
        expiresAt: Date.now() + 15000,
      };
      this.showInvitationModal = true;
      this.timeRemaining = 15;
      this.startCountdown();
    },

    startCountdown() {
      const timer = setInterval(() => {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          clearInterval(timer);
          this.expireInvitation();
        }
      }, 1000);
    },

    expireInvitation() {
      this.currentInvitation = null;
      this.showInvitationModal = false;
      this.timeRemaining = 15;
    },

    async acceptGameInvitation() {
      if (!this.currentInvitation) return;

      try {
        const response = await gameApi.acceptInvitation(this.currentInvitation.fromInviteId, {
          type: 'timed',
          initialTime: this.currentInvitation.gameDuration,
        });

        if (response.data?.gameId) {
          this.expireInvitation();
          navigateTo(`/game/${response.data.gameId}`);
        }
      } catch (error) {
        console.error(this.locales.t('errorAcceptingInvitation'), error);
      }
    },

    rejectGameInvitation() {
      this.expireInvitation();
    },
  },
});
