import { useChatStore } from '~/stores/chat';

export function useChatRoomsSSE() {
  const eventSource = ref<EventSource | null>(null);
  const isConnected = ref(false);
  const chatStore = useChatStore();

  const handleSSEMessage = async (data: any) => {
    switch (data.type) {
      case 'room_created':
        await chatStore.addRoom(data.data.room);
        break;
      case 'chat_room_update':
        await chatStore.fetchRooms();
        break;
      case 'new_chat_message':
        // Показываем уведомление только если чат закрыт
        if (!chatStore.isOpen && data.data.senderId && data.data.roomId) {
          chatStore.showMessageNotification(data.data.senderId, data.data.roomId);
        }
        break;
    }
  };

  const setupSSE = async () => {
    if (eventSource.value) return;

    eventSource.value = new EventSource('/api/sse/chat-rooms');
    eventSource.value.onopen = () => (isConnected.value = true);

    eventSource.value.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        await handleSSEMessage(data);
      } catch (error) {
        console.error('Error parsing chat rooms SSE message:', error);
      }
    };
  };

  const closeSSE = () => {
    eventSource.value?.close();
    eventSource.value = null;
    isConnected.value = false;
  };

  return { isConnected, setupSSE, closeSSE };
}
