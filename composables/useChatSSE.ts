// composables/useChatSSE.ts
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useChatStore } from '~/store/chat';
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';
import { useCookie } from '#app';

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
  const authToken = useCookie('auth_token');
  const isInitialized = ref(false);

  const isAuthenticated = computed(() => !!authToken.value);

  const setupSSE = () => {
    if (!isAuthenticated.value || !userStore.user?.isOnline) {
      closeSSE();
      return;
    }

    if (eventSource.value) {
      return; // SSE уже установлен
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
        case 'chat_room_update':
          chatStore.handleChatRoomUpdate(data.roomId);
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

  const refreshRooms = async () => {
    if (isAuthenticated.value && userStore.user && chatStore.rooms.length === 0) {
      await chatStore.fetchRooms();
    }
  };

  onUnmounted(() => {
    closeSSE();
    isInitialized.value = false;
  });

  return {
    setupSSE,
    closeSSE,
    refreshRooms,
  };
}
