import { ref, watch } from 'vue';
import { useUserStore } from '~/store/user';
import { useInvitationStore } from '~/store/invitation';
import { useFriendsStore } from '~/store/friends';
import { useAuthStore } from '~/store/auth';
import { useRouter } from 'vue-router';

export function useUserSSE() {
  const userStore = useUserStore();
  const friendsStore = useFriendsStore();
  const invitationStore = useInvitationStore();
  const authStore = useAuthStore();
  const router = useRouter();
  const eventSource = ref<EventSource | null>(null);

  const setupSSE = () => {
    if (eventSource.value) return;
    if (!authStore.isAuthenticated || !userStore.user?.isOnline || eventSource.value) {
      return;
    }

    eventSource.value = new EventSource('/api/sse/user-status');

    eventSource.value.onopen = (event) => {
      console.log('User SSE connection opened');
    };

    eventSource.value.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'user_status_update':
          userStore.updateUserStatus(data.userId, data.status.isOnline, data.status.isGame);
          break;
        case 'user_stats_update':
          userStore.updateUserStats(data.stats);
          break;
        case 'user_update':
          userStore.updateUser(data.user);
          break;
        case 'user_list_update':
          userStore.updateAllUsers(data.users);
          break;
        case 'user_added':
          userStore.addUser(data.user);
          break;
        case 'user_removed':
          userStore.removeUser(data.userId);
          break;
        case 'user_deleted':
          userStore.handleUserDeleted(data.userId);
          break;

        case 'game_invitation':
          invitationStore.handleGameInvitation(data.fromInviteId, data.fromInviteName, data.gameDuration);
          break;
        case 'game_invitation_expired':
          invitationStore.expireInvitation();
          break;
        case 'game_start':
          router.push(`/game/${data.gameId}`);
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
    };
  };

  const closeSSE = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
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

  return { setupSSE, closeSSE };
}
