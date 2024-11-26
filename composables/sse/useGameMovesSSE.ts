// composables/useGameMovesSSE.ts

import { ref, onUnmounted, watch } from 'vue';
import { useAuthStore } from '~/store/auth';
import { useGameStore } from '~/store/game';

export function useGameMovesSSE(gameId: string) {
  const gameStore = useGameStore();
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
      eventSource.value = new EventSource(`/api/sse/game-moves?gameId=${gameId}`);

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
          console.error('Error parsing game moves SSE message:', error);
        }
      };

      eventSource.value.onerror = (error) => {
        console.error('Game moves SSE error:', error);
        isConnected.value = false;

        if (gameStore.currentGame?.status === 'active' && reconnectAttempts.value < MAX_RECONNECT_ATTEMPTS) {
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
      case 'game_update':
        gameStore.updateGameState(data.game);
        break;
      case 'game_end':
        gameStore.handleGameEnd(data.result);
        break;
      case 'game_connection_close':
        closeSSE();
        break;
      case 'connection_established':
        isConnected.value = true;
        break;
      default:
        console.log('Unhandled game event type:', data.type);
    }
  };

  const closeSSE = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
      isConnected.value = false;
      reconnectAttempts.value = 0;
    }
  };

  // Следим за статусом игры
  watch(
    () => gameStore.currentGame?.status,
    (newStatus) => {
      if (newStatus === 'completed') {
        setTimeout(() => {
          closeSSE();
        }, 5000);
      }
    }
  );

  // Следим за аутентификацией
  watch(
    () => authStore.isAuthenticated,
    (newValue) => {
      if (!newValue) {
        closeSSE();
      } else if (gameStore.currentGame?.status === 'active') {
        setupSSE();
      }
    }
  );

  setupSSE();
  onUnmounted(closeSSE);

  return {
    isConnected,
    reconnectAttempts,
    closeSSE,
  };
}
