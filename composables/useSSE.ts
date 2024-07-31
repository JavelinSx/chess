import { onMounted, onUnmounted } from 'vue';
import { useUserStore } from '~/store/user';
import { useGameStore } from '~/store/game';

export function useSSE() {
  const userStore = useUserStore();
  const gameStore = useGameStore();
  let eventSource: EventSource | null = null;

  const setupSSE = () => {
    eventSource = new EventSource('/api/sse/user-status');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received SSE message:', data);

      switch (data.type) {
        case 'status_update':
          userStore.updateUserInList(data.userId, data.isOnline, data.isGame);
          break;
        case 'game_invitation':
          userStore.handleGameInvitation(data.fromInviteId, data.fromInviteName);
          break;
        case 'game_start':
          userStore.handleGameStart(data.gameId);
          break;
        case 'game_end':
          gameStore.handleGameEnd(data);
          break;
        // Добавьте другие типы событий по необходимости
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      closeSSE();
      setTimeout(setupSSE, 5000); // Попытка переподключения через 5 секунд
    };
  };

  const closeSSE = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  onMounted(() => {
    setupSSE();
  });

  onUnmounted(() => {
    closeSSE();
  });
}
