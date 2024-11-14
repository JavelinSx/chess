import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';

type GameDuration = 15 | 30 | 45 | 90;

interface Invitation {
  fromInviteId: string;
  fromInviteName: string;
  gameDuration: GameDuration;
  expiresAt: number;
}

export const useInvitationStore = defineStore('invitation', {
  state: () => ({
    currentInvitation: null as Invitation | null,
    showDurationSelector: false,
    showInvitationModal: false,
    inviteeId: '',
    invitationTimer: null as NodeJS.Timeout | null,
    locales: useI18n(),
  }),

  actions: {
    showDurationSelectorFor(userId: string) {
      this.inviteeId = userId;
      this.showDurationSelector = true;
    },

    closeDurationSelector() {
      this.showDurationSelector = false;
      this.inviteeId = '';
    },

    async sendGameInvitation(gameDuration: GameDuration) {
      if (!this.inviteeId) {
        return;
      }

      try {
        const response = await gameApi.sendInvitation(this.inviteeId, gameDuration);
        if (response.data && response.data.success) {
          console.log(this.locales.t('invitationSentSuccessfully'));
        } else if (response.error) {
          console.error(this.locales.t('failedToSendInvitation'), response.error);
        }
      } catch (error) {
        console.error(this.locales.t('failedToSendInvitation'), error);
      } finally {
        this.closeDurationSelector();
      }
    },

    handleGameInvitation(fromInviteId: string, fromInviteName: string, gameDuration: GameDuration) {
      this.currentInvitation = {
        fromInviteId,
        fromInviteName,
        gameDuration,
        expiresAt: Date.now() + 15000, // 15 seconds from now
      };
      this.showInvitationModal = true;
      this.startInvitationTimer();
    },

    startInvitationTimer() {
      if (this.invitationTimer) {
        clearTimeout(this.invitationTimer);
      }
      this.invitationTimer = setTimeout(() => {
        this.expireInvitation();
      }, 15000);
    },

    expireInvitation() {
      this.currentInvitation = null;
      this.showInvitationModal = false;
      if (this.invitationTimer) {
        clearTimeout(this.invitationTimer);
        this.invitationTimer = null;
      }
    },

    async acceptGameInvitation() {
      if (!this.currentInvitation) {
        return;
      }
      try {
        const response = await gameApi.acceptInvitation(this.currentInvitation.fromInviteId, {
          type: 'timed',
          initialTime: this.currentInvitation.gameDuration,
        });
        if (response.data && response.data.gameId) {
          this.expireInvitation();
          navigateTo(`/game/${response.data.gameId}`);
        } else if (response.error) {
          console.error(this.locales.t('failedToAcceptInvitation'), response.error);
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
