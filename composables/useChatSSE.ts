import { ref, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '~/store/chat';

interface ChatSSEReturn {
  closeSSE: () => void;
}

export function useChatSSE(): ChatSSEReturn {
  const chatStore = useChatStore();
  const eventSource = ref<EventSource | null>(null);

  const setupSSE = () => {
    eventSource.value = new EventSource('/api/sse/chat');

    eventSource.value.onopen = (event) => {};

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
          console.log('Unhandled game event type:', data.type);
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
    }
  };

  onMounted(() => {
    setupSSE();
    chatStore.fetchRooms();
  });

  onUnmounted(closeSSE);

  return {
    closeSSE,
  };
}
