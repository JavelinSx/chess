import { useAuthStore } from '~/stores/auth';
import { useInvitationStore } from '~/stores/invitation';
import { useUserStore } from '~/stores/user';

// useInvitationsSSE.ts
export function useInvitationsSSE() {
  const eventSource = ref<EventSource | null>(null);
  const userStore = useUserStore();
  const invitationStore = useInvitationStore();
  const authStore = useAuthStore();
  const router = useRouter();
  const isConnected = ref(false);
  const reconnectAttempts = ref(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000;

  const setupSSE = () => {
    if (!authStore.isAuthenticated || eventSource.value) {
      return;
    }

    return new Promise((resolve, reject) => {
      eventSource.value = new EventSource('/api/sse/invitations');

      eventSource.value.onopen = () => {
        console.log('Invitations SSE connection opened');
        isConnected.value = true;
        reconnectAttempts.value = 0;
        resolve(true);
      };

      eventSource.value.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Incoming invitation SSE event:', data);
        handleInvitationEvent(data);
      };

      eventSource.value.onerror = (error) => {
        console.error('Invitations SSE error:', error);
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

  const handleInvitationEvent = (data: any) => {
    switch (data.type) {
      case 'game_invitation':
        invitationStore.handleGameInvitation(
          data.fromInviteId,
          data.fromInviteName,
          data.gameDuration,
          data.startColor
        );
        break;
      case 'game_start':
        router.push(`/game/${data.gameId}`);
        break;
      case 'connection_established':
        console.log('Invitations connection established');
        break;
    }
  };

  const reconnect = async () => {
    console.log('hello1');
    if (isConnected.value || !authStore.isAuthenticated) return;

    if (reconnectAttempts.value < MAX_RECONNECT_ATTEMPTS) {
      console.log('hello2');
      const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts.value);
      await new Promise((resolve) => setTimeout(resolve, delay));
      reconnectAttempts.value++;
      await setupSSE();
    }
  };

  // Добавить интервал проверки соединения
  let checkInterval: NodeJS.Timeout;

  onMounted(() => {
    checkInterval = setInterval(() => {
      if (!isConnected.value && authStore.isAuthenticated && userStore.user?.isOnline) {
        reconnect();
      }
    }, 10000);
  });

  onUnmounted(() => {
    clearInterval(checkInterval);
  });

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

  return {
    setupSSE,
    closeSSE,
    isConnected,
  };
}
