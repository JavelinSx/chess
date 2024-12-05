import { useChatStore } from '~/stores/chat';

export function usePrivateChatSSE(roomId: string) {
  const chatStore = useChatStore();
  const eventSource = ref<EventSource | null>(null);
  const isConnected = ref(false);
  const reconnectAttempts = ref(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000;

  const handleSSEMessage = async (data: any) => {
    switch (data.type) {
      case 'new_message':
        await chatStore.handleNewMessage(data.data.message);
        break;
      case 'connection_established':
        console.log('connection_established');
        break;
      default:
        console.log('Unhandled private chat event type:', data.type);
    }
  };

  const setupSSE = async () => {
    if (eventSource.value) return;

    return new Promise((resolve, reject) => {
      try {
        eventSource.value = new EventSource(`/api/sse/private-chat/${roomId}`);

        eventSource.value.onopen = () => {
          isConnected.value = true;
          reconnectAttempts.value = 0;
          resolve(true);
        };

        eventSource.value.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            await handleSSEMessage(data);
          } catch (error) {
            console.error('Error parsing private chat SSE message:', error);
          }
        };

        eventSource.value.onerror = async (error) => {
          console.error('Private chat SSE error:', error);
          isConnected.value = false;

          if (chatStore.currentRoom && reconnectAttempts.value < MAX_RECONNECT_ATTEMPTS) {
            const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts.value);
            setTimeout(async () => {
              reconnectAttempts.value++;
              await setupSSE();
            }, delay);
          } else {
            await closeSSE();
            reject(error);
          }
        };
      } catch (error) {
        console.error('Error setting up private SSE:', error);
        reject(error);
      }
    });
  };

  const closeSSE = async () => {
    try {
      if (eventSource.value) {
        eventSource.value.close();
        eventSource.value = null;
        isConnected.value = false;
        reconnectAttempts.value = 0;
      }
    } catch (error) {
      console.error('Error closing private SSE:', error);
    }
  };

  return {
    isConnected,
    reconnectAttempts,
    setupSSE,
    closeSSE,
  };
}
