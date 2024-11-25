// composables/useSSEManagement.ts

import { onMounted, onBeforeUnmount } from 'vue';
import { useUserSSE } from './useUserSSE';
import { useChatSSE } from './useChatSSE';
import { useFriendsSSE } from './useFriendsSSE';
import { useInvitationsSSE } from './useInvitationsSSE';

export function useSSEManagement() {
  const { setupSSE: setupUserSSE, closeSSE: closeUserSSE } = useUserSSE();
  const { setupSSE: setupChatSSE, closeSSE: closeChatSSE } = useChatSSE();
  const { setupSSE: setupFriendsSSE, closeSSE: closeFriendsSSE } = useFriendsSSE();
  const { setupSSE: setupInvitationSSE, closeSSE: closeInvitationSSE } = useInvitationsSSE();

  const initializeSSE = async () => {
    try {
      await setupUserSSE();
      await setupChatSSE();
      await setupInvitationSSE();
      await setupFriendsSSE();
    } catch (error) {
      console.error('Failed to initialize SSE connections:', error);
      cleanupSSE();
    }
  };

  const cleanupSSE = () => {
    closeUserSSE();
    closeChatSSE();
    closeInvitationSSE();
    closeFriendsSSE();
  };

  onMounted(() => {
    initializeSSE();
  });

  onBeforeUnmount(() => {
    cleanupSSE();
  });

  return {
    initializeSSE,
    cleanupSSE,
  };
}
