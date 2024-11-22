import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';
import { useChatSSE } from '~/composables/sse/useChatSSE';
import { useUserSSE } from '~/composables/sse/useUserSSE';
import { useFriendsSSE } from './useFriendsSSE';
import { useInvitationsSSE } from './useInvitationsSSE';

export function useSSEManagement() {
  const authStore = useAuthStore();
  const userStore = useUserStore();

  const isInitialized = ref(false);
  const isConnected = ref(false);
  const { setupSSE: setupChatSSE, refreshRooms, closeSSE: closeChatSSE } = useChatSSE();
  const { setupSSE: setupUserSSE, closeSSE: closeUserSSE } = useUserSSE();
  const { setupSSE: setupInvitationsSSE, closeSSE: closeInvitationsSSE } = useInvitationsSSE();
  const { setupSSE: setupFriendsSSE, closeSSE: closeFriendsSSE } = useFriendsSSE();
  let reconnectTimeout: NodeJS.Timeout;

  const initializeSSE = async () => {
    if (isInitialized.value || !authStore.isAuthenticated || !userStore.user) return;

    try {
      await setupUserSSE();
      await setupChatSSE();
      await setupInvitationsSSE();
      await setupFriendsSSE();
      isInitialized.value = true;
      isConnected.value = true;
    } catch (error) {
      console.error('SSE initialization failed:', error);
      await cleanupSSE();
    }
  };

  const cleanupSSE = async () => {
    try {
      closeUserSSE();
      closeChatSSE();
      closeInvitationsSSE();
      closeFriendsSSE;
      isInitialized.value = false;
      isConnected.value = false;
    } catch (error) {
      console.error(error);
    }
  };

  const reconnect = () => {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(async () => {
      await cleanupSSE();
      await initializeSSE();
      console.log('hello');
    }, 5000); // Попытка переподключения через 5 секунд
  };

  const handleVisibilityChange = () => {
    if (!document.hidden && !isConnected.value && authStore.isAuthenticated) {
      reconnect();
    }
  };

  watch(
    () => authStore.isAuthenticated,
    (newValue) => {
      if (newValue && !isInitialized.value) {
        initializeSSE();
      } else if (!newValue) {
        cleanupSSE();
      }
    }
  );

  watch(
    () => userStore.user,
    (newValue) => {
      if (newValue && !isInitialized.value) {
        initializeSSE();
      }
    }
  );

  onMounted(() => {
    initializeSSE();
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onBeforeUnmount(() => {
    cleanupSSE();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearTimeout(reconnectTimeout);
  });

  if (import.meta.client) {
    window.addEventListener('beforeunload', cleanupSSE);
  }

  return { isInitialized, isConnected };
}
