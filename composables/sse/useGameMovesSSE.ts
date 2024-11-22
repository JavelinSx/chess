// composables/useGameMovesSSE.ts
import { ref, onUnmounted } from 'vue';
import { useAuthStore } from '~/store/auth';
import { useGameStore } from '~/store/game';
export function useGameMovesSSE(gameId: string) {
  const gameStore = useGameStore();
  const eventSource = ref<EventSource | null>(null);
  const authStore = useAuthStore();

  const setupSSE = () => {
    if (!authStore.isAuthenticated || eventSource.value) {
      return;
    }

    return new Promise((resolve, reject) => {
      eventSource.value = new EventSource(`/api/sse/game-moves?gameId=${gameId}`);

      eventSource.value.onopen = (event) => {
        console.log('User SSE connection opened');
        resolve(true);
      };

      eventSource.value.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'game_update':
            gameStore.updateGameState(data.game);
            break;
          case 'game_end':
            gameStore.handleGameEnd(data.result);
            break;
          case 'connection_established':
            console.log('connection_established');
            break;
          default:
            console.log('Unhandled game event type:', data.type);
        }
      };

      eventSource.value.onerror = (error) => {
        closeSSE();
        reject(error);
      };
      eventSource.value.close = () => {
        console.log('SSE connection closed');
      };
    });
  };

  watch(
    () => gameStore.currentGame,
    (newGame) => {
      if (!newGame || newGame.status === 'completed') {
        setTimeout(() => {
          closeSSE();
        }, 2000);
      }
    }
  );

  const closeSSE = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }
  };

  setupSSE();
  onUnmounted(closeSSE);

  return {
    closeSSE,
  };
}
