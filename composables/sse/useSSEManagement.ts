import { onMounted, onBeforeUnmount } from 'vue';
import { useUserSSE } from './useUserSSE';
import { useFriendsSSE } from './useFriendsSSE';
import { useInvitationsSSE } from './useInvitationsSSE';
import { useChatRoomsSSE } from '../chat/useChatRoomsSSE';

export function useSSEManagement() {
  const { setupSSE: setupUserSSE, closeSSE: closeUserSSE } = useUserSSE();
  const { setupSSE: setupFriendsSSE, closeSSE: closeFriendsSSE } = useFriendsSSE();
  const { setupSSE: setupInvitationSSE, closeSSE: closeInvitationSSE } = useInvitationsSSE();
  const { setupSSE: setupChatRoomsSSE, closeSSE: closeChatRoomsSSE } = useChatRoomsSSE();

  const initializeSSE = async () => {
    try {
      await setupUserSSE();
      await setupInvitationSSE();
      await setupFriendsSSE();
      await setupChatRoomsSSE();
    } catch (error) {
      console.error('Failed to initialize SSE connections:', error);
      cleanupSSE();
    }
  };

  const cleanupSSE = async () => {
    closeUserSSE();
    closeInvitationSSE();
    closeFriendsSSE();
    await closeChatRoomsSSE();
  };

  onMounted(async () => {
    await initializeSSE();
  });

  onBeforeUnmount(() => {
    cleanupSSE();
  });

  return {
    initializeSSE,
    cleanupSSE,
  };
}
