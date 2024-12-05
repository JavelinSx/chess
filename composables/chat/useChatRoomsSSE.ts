import { useChatStore } from '~/stores/chat';

// composables/useChatRoomsSSE.ts
export function useChatRoomsSSE() {
  const chatStore = useChatStore();
  const eventSource = ref<EventSource | null>(null);
  const isConnected = ref(false);
  const reconnectAttempts = ref(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000;

  const setupSSE = () => {
    if (eventSource.value) return;

    return new Promise((resolve, reject) => {
      eventSource.value = new EventSource('/api/sse/chat-rooms');

      eventSource.value.onopen = () => {
        isConnected.value = true;
        reconnectAttempts.value = 0;
        resolve(true);
      };

      eventSource.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleSSEMessage(data);
        } catch (error) {
          console.error('Error parsing chat rooms SSE message:', error);
        }
      };

      eventSource.value.onerror = (error) => {
        console.error('Chat rooms SSE error:', error);
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

  const handleSSEMessage = (data: any) => {
    switch (data.type) {
      case 'room_created':
        chatStore.addRoom(data.data.room);
        break;
      case 'room_deleted':
        chatStore.deleteRoom(data.data.roomId);
        break;
      case 'chat_room_update':
        chatStore.fetchRooms();
        break;
      case 'connection_established':
        console.log('connection_established');
        break;
      default:
        console.log('Unhandled chat rooms event type:', data.type);
    }
  };

  const closeSSE = async () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
      isConnected.value = false;
      reconnectAttempts.value = 0;
    }
  };

  setupSSE();
  onUnmounted(closeSSE);

  return {
    isConnected,
    reconnectAttempts,
    setupSSE,
    closeSSE,
  };
}
