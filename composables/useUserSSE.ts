import { ref, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '~/store/user';
import { useInvitationStore } from '~/store/invitation';
import { useFriendsStore } from '~/store/friends';
interface UserSSEReturn {
  closeSSE: () => void;
}

export function useUserSSE(): UserSSEReturn {
  const userStore = useUserStore();
  const friendsStore = useFriendsStore();
  const invitationStore = useInvitationStore();
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
          invitationStore.handleGameInvitation(data.fromInviteId, data.fromInviteName);
          break;
        case 'game_start':
          navigateTo(`/game/${data.gameId}`);
          break;
        case 'friend_request':
          console.log('Handling friend request:', data.request);
          friendsStore.handleFriendRequest(data.request);
          break;
        case 'friend_request_update':
          console.log('Received friend request update:', data.request);
          friendsStore.handleFriendRequestUpdate(data.request);
          break;
        case 'friend_list_update':
          console.log('Received friend list update:', data.friends);
          if (Array.isArray(data.friends) && data.friends.length > 0) {
            friendsStore.handleFriendListUpdate(data.friends);
          } else {
            console.warn('Received empty or invalid friends list');
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
      setTimeout(setupSSE, 20000); // Попытка переподключения через 5 секунд
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
