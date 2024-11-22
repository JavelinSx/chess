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
    if (!authStore.isAuthenticated || eventSource.value) {
      return;
    }
    return new Promise((resolve, reject) => {
      eventSource.value = new EventSource('/api/sse/user-status');

      eventSource.value.onopen = (event) => {
        resolve(true);
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
          case 'connection_established':
            console.log('connection_established');
            break;
          default:
            console.log('Unhandled user event type:', data.type);
        }
      };

      eventSource.value.onerror = (error) => {
        console.error('User SSE error:', error);
        closeSSE();
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
