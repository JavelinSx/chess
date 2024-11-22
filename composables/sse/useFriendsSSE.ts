import { useAuthStore } from '~/store/auth';
import { useFriendsStore } from '~/store/friends';
import { useUserStore } from '~/store/user';

// composables/useFriendSSE.ts
export function useFriendsSSE() {
  const friendsStore = useFriendsStore();
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const eventSource = ref<EventSource | null>(null);

  const setupSSE = () => {
    if (!authStore.isAuthenticated || eventSource.value) {
      return;
    }

    return new Promise((resolve, reject) => {
      eventSource.value = new EventSource('/api/sse/friends');

      eventSource.value.onopen = () => {
        console.log('Friends SSE connection opened');
        resolve(true);
      };

      eventSource.value.onmessage = (event) => {
        const data = JSON.parse(event.data);

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

      eventSource.value.onerror = (error) => {
        console.error('Friends SSE error:', error);
        closeSSE();

        // Попытка переподключения через 5 секунд
        setTimeout(() => {
          if (authStore.isAuthenticated && userStore.user?.isOnline) {
            setupSSE();
          }
        }, 5000);
        reject(error);
      };
    });
  };

  const closeSSE = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
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

  // Очистка при размонтировании компонента
  onBeforeUnmount(() => {
    closeSSE();
  });

  // Инициализация при монтировании
  onMounted(() => {
    if (authStore.isAuthenticated && userStore.user?.isOnline) {
      setupSSE();
    }
  });

  return {
    setupSSE,
    closeSSE,
  };
}
