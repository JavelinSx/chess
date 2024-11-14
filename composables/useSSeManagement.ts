import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';
import { useChatSSE } from '~/composables/useChatSSE';
import { useUserSSE } from '~/composables/useUserSSE';

export function useSSEManagement() {
  const authStore = useAuthStore();
  const userStore = useUserStore();

  const isInitialized = ref(false);
  const isConnected = ref(false);
  const { setupSSE: setupChatSSE, refreshRooms, closeSSE: closeChatSSE } = useChatSSE();
  const { setupSSE: setupUserSSE, closeSSE: closeUserSSE } = useUserSSE();

  let reconnectTimeout: NodeJS.Timeout;

  const initializeSSE = async () => {
    if (isInitialized.value || !authStore.isAuthenticated || !userStore.user) return;
    setupUserSSE();
    setupChatSSE();
    await refreshRooms();
    isInitialized.value = true;
    isConnected.value = true;
  };

  const cleanupSSE = async () => {
    closeUserSSE();
    closeChatSSE();
    isInitialized.value = false;
    isConnected.value = false;
  };

  const reconnect = () => {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(async () => {
      await cleanupSSE();
      await initializeSSE();
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
