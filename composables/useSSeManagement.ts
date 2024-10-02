import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';
import { useChatSSE } from '~/composables/useChatSSE';
import { useUserSSE } from '~/composables/useUserSSE';

export function useSSEManagement() {
  const authStore = useAuthStore();
  const userStore = useUserStore();

  const isInitialized = ref(false);
  const { setupSSE: setupChatSSE, refreshRooms, closeSSE: closeChatSSE } = useChatSSE();
  const { setupSSE: setupUserSSE, closeSSE: closeUserSSE } = useUserSSE();

  const initializeSSE = async () => {
    if (isInitialized.value || !authStore.isAuthenticated || !userStore.user) return;

    await userStore.updateCurrentUserStatus(true, false);
    setupUserSSE();
    setupChatSSE();
    await refreshRooms();
    isInitialized.value = true;
  };

  const cleanupSSE = async () => {
    if (authStore.isAuthenticated && userStore.user) {
      await userStore.updateCurrentUserStatus(false, false);
    }
    closeUserSSE();
    closeChatSSE();
    isInitialized.value = false;
  };

  watch(
    () => authStore.isAuthenticated,
    (newValue) => {
      if (newValue && isInitialized) {
        initializeSSE();
      } else {
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

  onMounted(initializeSSE);
  onBeforeUnmount(cleanupSSE);

  if (import.meta.client) {
    window.addEventListener('beforeunload', cleanupSSE);
  }

  return { isInitialized };
}
