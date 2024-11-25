import { useAuthStore } from '~/store/auth';
import { useFriendsStore } from '~/store/friends';
import { useUserStore } from '~/store/user';

// composables/useFriendSSE.ts
export function useFriendsSSE() {
  const friendsStore = useFriendsStore();
  const authStore = useAuthStore();
  const userStore = useUserStore();
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
      eventSource.value = new EventSource('/api/sse/friends');

      eventSource.value.onopen = () => {
        console.log('Friends SSE connection opened');
        isConnected.value = true;
        reconnectAttempts.value = 0;
        resolve(true);
      };

      eventSource.value.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Incoming invitation SSE event:', data);
        handleFriendEvent(data);
      };

      eventSource.value.onerror = (error) => {
        console.error('Friends SSE error:', error);
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

  const handleFriendEvent = (data: any) => {
    switch (data.type) {
      case 'friend_request':
        friendsStore.handleFriendRequest(data.request);
        break;
      case 'friend_request_update':
        friendsStore.handleFriendRequestUpdate(data.request);
        break;
      case 'friend_list_update':
        if (Array.isArray(data.friends) && data.friends.length > 0) {
          friendsStore.handleFriendListUpdate(data.friends);
        } else {
          friendsStore.fetchFriends();
        }
        break;
      case 'connection_established':
        console.log('connection_established');
        break;
      default:
        console.log('Unhandled friend event:', data.type);
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
    setupSSE,
    closeSSE,
  };
}
