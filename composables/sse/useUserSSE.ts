// composables/useUserSSE.ts

import { ref, watch } from 'vue';
import { useUserStore } from '~/stores/user';
import { useAuthStore } from '~/stores/auth';

export function useUserSSE() {
  const userStore = useUserStore();
  const authStore = useAuthStore();
  const eventSource = ref<EventSource | null>(null);
  const isConnected = ref(false);
  const reconnectAttempts = ref(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000;

  const setupSSE = () => {
    if (!authStore.isAuthenticated || eventSource.value) {
      return;
    }

    return new Promise((resolve, reject) => {
      eventSource.value = new EventSource('/api/sse/user-status');

      eventSource.value.onopen = () => {
        isConnected.value = true;
        reconnectAttempts.value = 0;
        resolve(true);
      };

      eventSource.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleSSEMessage(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.value.onerror = (error) => {
        console.error('User SSE error:', error);
        isConnected.value = false;

        if (reconnectAttempts.value < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts.value);
          setTimeout(() => {
            reconnectAttempts.value++;
            setupSSE();
          }, delay);
        } else {
          closeSSE();
          reject(error);
        }
      };
    });
  };

  const handleSSEMessage = (data: any) => {
    switch (data.type) {
      case 'user_status_update':
        userStore.updateUserStatus(data.userId, data.status.isOnline, data.status.isGame);
        break;
      case 'user_stats_update':
        userStore.updateUserStats(data.stats);
        break;
      case 'user_update':
        userStore.updateUser(data.user);
        break;
      case 'user_list_update':
        userStore.updateAllUsers(data.users);
        break;
      case 'user_added':
        userStore.addUser(data.user);
        break;
      case 'user_removed':
        userStore.removeUser(data.userId);
        break;
      case 'user_deleted':
        userStore.handleUserDeleted(data.userId);
        break;
      case 'connection_established':
        isConnected.value = true;
        break;
      default:
        console.log('Unhandled user event type:', data.type);
    }
  };

  const closeSSE = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
      isConnected.value = false;
    }
  };

  // Следим за аутентификацией
  watch(
    () => authStore.isAuthenticated,
    (newValue) => {
      if (!newValue) {
        closeSSE();
      } else if (userStore.user?.isOnline) {
        setupSSE();
      }
    }
  );

  // Следим за онлайн статусом пользователя
  watch(
    () => userStore.user?.isOnline,
    (newValue) => {
      if (authStore.isAuthenticated) {
        if (newValue) {
          setupSSE();
        } else {
          closeSSE();
        }
      }
    }
  );

  return {
    isConnected,
    reconnectAttempts,
    setupSSE,
    closeSSE,
  };
}
