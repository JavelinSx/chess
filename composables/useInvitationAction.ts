import { useInvitationStore } from '~/store/invitation';

// composables/useInviteAction.ts
export function useInviteAction() {
  const invitationStore = useInvitationStore();
  const clickTime = ref(0);

  const handleInvite = (user: { _id: string; username: string }) => {
    // Защита от множественных быстрых кликов
    const now = Date.now();
    if (now - clickTime.value < 1000) {
      return;
    }
    clickTime.value = now;

    invitationStore.showDurationSelectorFor(user);
  };

  return {
    handleInvite,
  };
}
