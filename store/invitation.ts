// store/invitation.ts
import { defineStore } from 'pinia';
import { gameApi } from '~/shared/api/game';

type GameDuration = 15 | 30 | 45 | 90;

interface InfoInvitation {
  _id: string;
  username: string;
}

export const useInvitationStore = defineStore('invitation', {
  state: () => ({
    showDurationSelector: false,
    infoInvitation: null as InfoInvitation | null,
    isSending: false,
    isProcessing: false,
    locales: useI18n(),
  }),

  actions: {
    showDurationSelectorFor(infoInvitation: InfoInvitation) {
      if (this.isProcessing) {
        console.log('Processing in progress, ignoring click');
        return;
      }

      this.isProcessing = true;

      this.infoInvitation = {
        _id: infoInvitation._id,
        username: infoInvitation.username,
      };

      this.showDurationSelector = true;
    },

    closeDurationSelector() {
      this.showDurationSelector = false;
      this.isProcessing = false;
    },

    async sendGameInvitation(infoInvitation: InfoInvitation, gameDuration: GameDuration) {
      if (!infoInvitation) return false;

      this.isSending = true;
      try {
        const response = await gameApi.sendInvitation(infoInvitation._id, gameDuration);
        if (response.data?.success) {
          this.closeDurationSelector();
          return true;
        }
      } catch (error) {
        console.error('Failed to send invitation:', error);
      } finally {
        this.isSending = false;
      }
      return false;
    },

    handleGameInvitation(fromInviteId: string, fromInviteName: string, gameDuration: GameDuration) {
      const toast = useToast();

      toast.add({
        id: `game-invitation-${fromInviteId}`,
        title: this.locales.t('game.gameInvitation'),
        description: `${fromInviteName} ${this.locales.t('game.invitesYouToPlay')} (${gameDuration} ${this.locales.t(
          'game.minutes'
        )})`,
        timeout: 15000,
        color: 'primary',
        icon: 'i-heroicons-play',
        actions: [
          {
            label: this.locales.t('common.accept'),
            color: 'green',
            variant: 'solid',
            click: () => this.acceptGameInvitation(fromInviteId, gameDuration),
          },
          {
            label: this.locales.t('common.decline'),
            color: 'red',
            variant: 'soft',
            click: () => toast.remove(`game-invitation-${fromInviteId}`),
          },
        ],
      });
    },

    async acceptGameInvitation(fromInviteId: string, gameDuration: GameDuration) {
      const toast = useToast();

      try {
        const response = await gameApi.acceptInvitation(fromInviteId, {
          type: 'timed',
          initialTime: gameDuration,
        });

        if (response.data?.gameId) {
          toast.remove(`game-invitation-${fromInviteId}`);
          navigateTo(`/game/${response.data.gameId}`);
        }
      } catch (error) {
        toast.add({
          title: this.locales.t('errorAcceptingInvitation'),
          color: 'red',
          icon: 'i-heroicons-x-circle',
        });
      }
    },
    async rejectGameInvitation() {
      const toast = useToast();
      try {
        await gameApi.rejectInvitation();
      } catch (error) {
        toast.add({
          title: this.locales.t('errorRejectingInvitation'),
          color: 'red',
          icon: 'i-heroicons-x-circle',
        });
      }
    },
  },
});
