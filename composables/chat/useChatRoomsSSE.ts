import { useChatStore } from '~/stores/chat';

export function useChatRoomsSSE() {
  const chatStore = useChatStore();
  const eventSource = ref<EventSource | null>(null);
  const isConnected = ref(false);
  const reconnectAttempts = ref(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000;

  const handleSSEMessage = async (data: any) => {
    switch (data.type) {
      case 'room_created':
        await chatStore.addRoom(data.data.room);
        break;
      case 'room_deleted':
        await chatStore.deleteRoom(data.data.roomId);
        break;
      case 'chat_room_update':
        await chatStore.fetchRooms();
        break;
      case 'connection_established':
        console.log('connection_established');
        break;
      default:
        console.log('Unhandled chat rooms event type:', data.type);
    }
  };

  const setupSSE = async () => {
    if (eventSource.value) return;

    return new Promise((resolve, reject) => {
      try {
        eventSource.value = new EventSource('/api/sse/chat-rooms');

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
            console.error('Error parsing chat rooms SSE message:', error);
          }
        };

        eventSource.value.onerror = async (error) => {
          console.error('Chat rooms SSE error:', error);
          isConnected.value = false;

          if (reconnectAttempts.value < MAX_RECONNECT_ATTEMPTS) {
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
        console.error('Error setting up SSE:', error);
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
      console.error('Error closing SSE:', error);
    }
  };

  return {
    isConnected,
    reconnectAttempts,
    setupSSE,
    closeSSE,
  };
}
