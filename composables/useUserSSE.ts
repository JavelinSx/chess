import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useUserStore } from '~/store/user';
import { useInvitationStore } from '~/store/invitation';
import { useFriendsStore } from '~/store/friends';
import { useAuthStore } from '~/store/auth';

interface UserSSEReturn {
  closeSSE: () => void;
}

export function useUserSSE(): UserSSEReturn {
  const userStore = useUserStore();
  const friendsStore = useFriendsStore();
  const invitationStore = useInvitationStore();
  const authStore = useAuthStore();
  const eventSource = ref<EventSource | null>(null);

  const setupSSE = () => {
    if (!authStore.isAuthenticated || !userStore.user?.isOnline) {
      closeSSE();
      return;
    }

    eventSource.value = new EventSource('/api/sse/user-status');

    eventSource.value.onopen = (event) => {
      console.log('User SSE connection opened');
    };

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
          invitationStore.handleGameInvitation(data.fromInviteId, data.fromInviteName);
          break;
        case 'game_start':
          navigateTo(`/game/${data.gameId}`);
          break;
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
        default:
          console.log('Unhandled user event type:', data.type);
      }
    };

    eventSource.value.onerror = (error) => {
      console.error('User SSE error:', error);
      closeSSE();
      setTimeout(setupSSE, 20000);
    };
  };

  const closeSSE = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }
  };

  onMounted(() => {
    if (authStore.isAuthenticated && userStore.user?.isOnline) {
      setupSSE();
    }
  });

  onUnmounted(closeSSE);

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
    closeSSE,
  };
}
