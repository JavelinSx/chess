import type { ChatMessage } from '~/server/services/chat/types';

export function usePrivateChatSSE(roomId: string, onNewMessage: (message: ChatMessage) => void) {
  const eventSource = ref<EventSource | null>(null);
  const isConnected = ref(false);

  const handleSSEMessage = (data: any) => {
    if (data.type === 'new_message' && data.data?.message) {
      onNewMessage(data.data.message);
    }
  };

  const setupSSE = () => {
    if (eventSource.value) return;

    eventSource.value = new EventSource(`/api/sse/private-chat/${roomId}`);
    eventSource.value.onopen = () => (isConnected.value = true);

    eventSource.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSSEMessage(data);
      } catch (error) {
        console.error('Error parsing private chat SSE message:', error);
      }
    };
  };

  const closeSSE = () => {
    console.log('close chat sse');
    eventSource.value?.close();
    eventSource.value = null;
    isConnected.value = false;
  };

  return { isConnected, setupSSE, closeSSE };
}
