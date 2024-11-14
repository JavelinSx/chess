// composables/useGameSSE.ts
import { ref, onUnmounted } from 'vue';
import { useGameStore } from '~/store/game';
import { useRouter } from 'vue-router';

export function useGameSSE(gameId: string) {
  const gameStore = useGameStore();
  const router = useRouter();
  const eventSource = ref<EventSource | null>(null);

  const setupSSE = () => {
    if (eventSource.value) return;
    eventSource.value = new EventSource(`/api/sse/game-moves?gameId=${gameId}`);

    eventSource.value.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'game_update':
          gameStore.updateGameState(data.game);
          break;
        case 'game_end':
          gameStore.handleGameEnd(data.result);
          break;
        default:
          console.log('Unhandled game event type:', data.type);
      }
    };

    eventSource.value.onerror = (error) => {
      closeSSE();
    };
    eventSource.value.close = () => {
      console.log('SSE connection closed');
    };
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
