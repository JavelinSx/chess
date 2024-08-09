import { ref, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '~/store/user';

interface UserSSEReturn {
  closeSSE: () => void;
}

export function useUserSSE(): UserSSEReturn {
  const userStore = useUserStore();
  const eventSource = ref<EventSource | null>(null);

  const setupSSE = () => {
    eventSource.value = new EventSource('/api/sse/user-status');

    eventSource.value.onopen = (event) => {};

    eventSource.value.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'status_update':
          userStore.updateUserInList(data.userId, data.isOnline, data.isGame);
          break;
        case 'user_list_update':
          userStore.updateAllUsers(data.users);
          break;
        case 'stats_update':
          userStore.updateUserStats(data.stats);
          break;
        case 'game_invitation':
          userStore.handleGameInvitation(data.fromInviteId, data.fromInviteName);
          break;
        case 'game_start':
          navigateTo(`/game/${data.gameId}`);
          break;
        default:
          console.log('Unhandled user event type:', data.type);
      }
    };

    eventSource.value.onerror = (error) => {
      console.error('User SSE error:', error);
      closeSSE();
      setTimeout(setupSSE, 5000); // Попытка переподключения через 5 секунд
    };
  };

  const closeSSE = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }
  };

  onMounted(setupSSE);
  onUnmounted(closeSSE);

  return {
    closeSSE,
  };
}
