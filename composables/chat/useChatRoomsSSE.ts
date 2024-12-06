import { useChatStore } from '~/stores/chat';
import { useUserStore } from '~/stores/user';

export function useChatRoomsSSE() {
  const eventSource = ref<EventSource | null>(null);
  const isConnected = ref(false);
  const chatStore = useChatStore();
  const userStore = useUserStore();
  const toast = useToast();

  const handleSSEMessage = async (data: any) => {
    switch (data.type) {
      case 'room_created':
        await chatStore.addRoom(data.data.room);
        break;
      case 'chat_room_update':
        await chatStore.fetchRooms();
        break;
      case 'new_chat_message':
        const senderId = data.data.senderId;
        const roomId = data.data.roomId;
        if (senderId && roomId) {
          chatStore.showMessageNotification(senderId, roomId);
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
    console.log('hello');
    eventSource.value?.close();
    eventSource.value = null;
    isConnected.value = false;
  };

  return { isConnected, setupSSE, closeSSE };
}
