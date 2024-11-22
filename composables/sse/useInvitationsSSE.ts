import { useAuthStore } from '~/store/auth';
import { useInvitationStore } from '~/store/invitation';
import { useUserStore } from '~/store/user';

// useInvitationsSSE.ts
export function useInvitationsSSE() {
  const eventSource = ref<EventSource | null>(null);
  const userStore = useUserStore();
  const invitationStore = useInvitationStore();
  const authStore = useAuthStore();
  const router = useRouter();
  const isConnected = ref(false);

  const setupSSE = () => {
    if (!authStore.isAuthenticated || eventSource.value) {
      return;
    }

    return new Promise((resolve, reject) => {
      eventSource.value = new EventSource('/api/sse/invitations');

      eventSource.value.onopen = () => {
        console.log('Invitations SSE connection opened');
        isConnected.value = true;
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
        closeSSE();

        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (authStore.isAuthenticated && userStore.user?.isOnline) {
            setupSSE();
          }
        }, 3000);

        reject(error);
      };
    });
  };

  const handleInvitationEvent = (data: any) => {
    switch (data.type) {
      case 'game_invitation':
        invitationStore.handleGameInvitation(data.fromInviteId, data.fromInviteName, data.gameDuration);
        break;
      case 'game_invitation_expired':
        invitationStore.expireInvitation();
        break;
      case 'game_start':
        router.push(`/game/${data.gameId}`);
        break;
      case 'connection_established':
        console.log('Invitations connection established');
        break;
    }
  };

  const closeSSE = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
      isConnected.value = false;
    }
  };

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
    setupSSE,
    closeSSE,
    isConnected,
  };
}
