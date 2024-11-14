import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useChatStore } from '~/store/chat';
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';

interface ChatSSEReturn {
  setupSSE: () => void;
  closeSSE: () => void;
  refreshRooms: () => Promise<void>;
}

export function useChatSSE(): ChatSSEReturn {
  const chatStore = useChatStore();
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const eventSource = ref<EventSource | null>(null);
  const isInitialized = ref(false);

  const setupSSE = () => {
    if (!authStore.isAuthenticated || eventSource.value) {
      return;
    }

    eventSource.value = new EventSource('/api/sse/chat');

    eventSource.value.onopen = () => {
      isInitialized.value = true;
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
        case 'chat_room_update':
          chatStore.handleChatRoomUpdate(data.roomId);
          break;
        default:
          console.log('Unhandled chat event type:', data.type);
      }
    };

    eventSource.value.onerror = (error) => {
      closeSSE();
      setTimeout(setupSSE, 5000);
    };
  };

  const closeSSE = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
      isInitialized.value = false;
    }
  };

  const refreshRooms = async () => {
    if (authStore.isAuthenticated && userStore.user && chatStore.rooms.length === 0) {
      await chatStore.fetchRooms();
    }
  };

  watch(
    () => authStore.isAuthenticated,
    (newValue) => {
      if (newValue) {
        setupSSE();
        refreshRooms();
      } else {
        closeSSE();
      }
    }
  );

  onMounted(() => {
    if (authStore.isAuthenticated) {
      setupSSE();
      refreshRooms();
    }
  });

  onUnmounted(() => {
    closeSSE();
  });

  return {
    setupSSE,
    closeSSE,
    refreshRooms,
  };
}
