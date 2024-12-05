import { useChatStore } from '~/stores/chat';

// composables/usePrivateChatSSE.ts
export function usePrivateChatSSE(roomId: string) {
  const chatStore = useChatStore();
  const eventSource = ref<EventSource | null>(null);
  const isConnected = ref(false);
  const reconnectAttempts = ref(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000;

  const setupSSE = () => {
    if (eventSource.value) return;

    return new Promise((resolve, reject) => {
      eventSource.value = new EventSource(`/api/sse/private-chat/${roomId}`);

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
          console.error('Error parsing private chat SSE message:', error);
        }
      };

      eventSource.value.onerror = (error) => {
        console.error('Private chat SSE error:', error);
        isConnected.value = false;

        if (chatStore.currentRoom && reconnectAttempts.value < MAX_RECONNECT_ATTEMPTS) {
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
      case 'new_message':
        chatStore.handleNewMessage(data.data.message);
        break;
      case 'connection_established':
        console.log('connection_established');
        break;
      default:
        console.log('Unhandled private chat event type:', data.type);
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

  watch(
    () => chatStore.currentRoom?._id,
    (newRoomId) => {
      if (newRoomId !== roomId) {
        closeSSE();
      } else {
        setupSSE();
      }
    }
  );

  setupSSE();
  onUnmounted(closeSSE);

  return {
    isConnected,
    reconnectAttempts,
    closeSSE,
  };
}
