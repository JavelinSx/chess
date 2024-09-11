import { ref, onUnmounted } from 'vue';
import { useGameStore } from '~/store/game';

interface GameSSEReturn {
  closeSSE: () => void;
}

export function useGameSSE(gameId: string): GameSSEReturn {
  const gameStore = useGameStore();
  const eventSource = ref<EventSource | null>(null);

  const setupSSE = () => {
    eventSource.value = new EventSource(`/api/sse/game-moves?gameId=${gameId}`);

    eventSource.value.onopen = (event) => {};

    eventSource.value.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.value?.close();
      setTimeout(setupSSE, 5000); // Попытка переподключения через 5 секунд
    };

    eventSource.value.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'game_update':
          gameStore.updateGameState(data.game);
          break;
        case 'game_end':
          gameStore.handleGameEnd(data.result);
          closeSSE();
          navigateTo('/');
          break;
        default:
          console.log('Unhandled game event type:', data.type);
      }
    };

    eventSource.value.onerror = (error) => {
      closeSSE();
    };
  };

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
