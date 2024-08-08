import { ref, onUnmounted } from 'vue';
import { useGameStore } from '~/store/game';

interface GameSSEReturn {
  closeSSE: () => void;
}

export function useGameSSE(gameId: string): GameSSEReturn {
  const gameStore = useGameStore();
  const eventSource = ref<EventSource | null>(null);

  const setupSSE = () => {
    console.log('Setting up game SSE connection');
    eventSource.value = new EventSource(`/api/sse/game-moves?gameId=${gameId}`);

    eventSource.value.onopen = (event) => {
      console.log('Game SSE connection opened:', event);
    };

    eventSource.value.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received game SSE message:', data);

      switch (data.type) {
        case 'game_update':
          gameStore.updateGameState(data.game);
          break;
        case 'game_end':
          console.log('Received game_end event:', data);
          gameStore.handleGameEnd(data.result);
          closeSSE();
          navigateTo('/');
          break;
        default:
          console.log('Unhandled game event type:', data.type);
      }
    };

    eventSource.value.onerror = (error) => {
      console.error('Game SSE error:', error);
      closeSSE();
    };
  };

  const closeSSE = () => {
    console.log('Closing game SSE connection');
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
