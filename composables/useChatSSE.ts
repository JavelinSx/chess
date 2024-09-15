import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useChatStore } from '~/store/chat';
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';

interface ChatSSEReturn {
  closeSSE: () => void;
}

export function useChatSSE(): ChatSSEReturn {
  const chatStore = useChatStore();
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const eventSource = ref<EventSource | null>(null);

  const setupSSE = () => {
    if (!authStore.isAuthenticated || !userStore.user?.isOnline) {
      closeSSE();
      return;
    }

    eventSource.value = new EventSource('/api/sse/chat');

    eventSource.value.onopen = (event) => {
      console.log('Chat SSE connection opened');
    };

    eventSource.value.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'new_message':
          chatStore.addMessageToRoom(data.data.roomId, data.data.message);
          break;
        case 'room_created':
          chatStore.addRoom(data.data);
          break;
        default:
          console.log('Unhandled chat event type:', data.type);
      }
    };

    eventSource.value.onerror = (error) => {
      console.error('Chat SSE error:', error);
      closeSSE();
      setTimeout(setupSSE, 5000);
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
