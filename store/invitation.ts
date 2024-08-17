import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';

interface Invitation {
  fromInviteId: string;
  fromInviteName: string;
}

export const useInvitationStore = defineStore('invitation', {
  state: () => ({
    currentInvitation: null as Invitation | null,
  }),

  actions: {
    async acceptGameInvitation() {
      if (!this.currentInvitation) {
        console.error('No current invitation to accept');
        return;
      }
      try {
        const response = await gameApi.acceptInvitation(this.currentInvitation.fromInviteId);
        if (response.data && response.data.gameId) {
          this.currentInvitation = null;
          navigateTo(`/game/${response.data.gameId}`);
        } else if (response.error) {
          console.error('Failed to accept game invitation:', response.error);
        }
      } catch (error) {
        console.error('Error accepting game invitation:', error);
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
        console.error('Failed to send game invitation:', response.error);
      } else if (response.data && response.data.success) {
        console.log('Game invitation sent successfully');
      }
    },
  },
});
