import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';

interface Invitation {
  fromInviteId: string;
  fromInviteName: string;
}

export const useInvitationStore = defineStore('invitation', {
  state: () => ({
    currentInvitation: null as Invitation | null,
    locales: useI18n(),
  }),

  actions: {
    async acceptGameInvitation() {
      if (!this.currentInvitation) {
        console.error(this.locales.t('noCurrentInvitation'));
        return;
      }
      try {
        const response = await gameApi.acceptInvitation(this.currentInvitation.fromInviteId);
        if (response.data && response.data.gameId) {
          this.currentInvitation = null;
          navigateTo(`/game/${response.data.gameId}`);
        } else if (response.error) {
          console.error(this.locales.t('failedToAcceptInvitation'), response.error);
        }
      } catch (error) {
        console.error(this.locales.t('errorAcceptingInvitation'), error);
      }
    },

    rejectGameInvitation() {
      this.currentInvitation = null;
    },

    handleGameInvitation(fromInviteId: string, fromInviteName: string) {
      this.currentInvitation = { fromInviteId, fromInviteName };
    },

    async sendGameInvitation(toInviteId: string) {
      const response = await gameApi.sendInvitation(toInviteId);
      if (response.error) {
        console.error(this.locales.t('failedToSendInvitation'), response.error);
      } else if (response.data && response.data.success) {
        console.log(this.locales.t('invitationSentSuccessfully'));
      }
    },
  },
});
