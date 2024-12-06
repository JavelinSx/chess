import { usePrivateChatSSE } from '~/composables/chat/usePrivateChatSSE';
import type { ChatMessage, ChatRoom } from '~/server/services/chat/types';
import { chatApi } from '~/shared/api/chat';

export const useChatStore = defineStore('chat', () => {
  const state = reactive({
    rooms: [] as ChatRoom[],
    currentRoom: null as ChatRoom | null,
    isOpen: false,
    isLoading: false,
    error: null as string | null,
    hasMoreMessages: true,
    currentPage: 1,
    messages: [] as ChatMessage[],
  });

  const privateChatSSE = ref<{ setupSSE: () => void; closeSSE: () => void } | null>(null);

  const sortedRooms = computed(() =>
    [...state.rooms].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
  );

  const userStore = useUserStore();
  const currentUserId = computed(() => userStore.user?._id);

  const toast = useToast();
  let currentToastId: string | null = null;

  const showMessageNotification = (sender: string, roomId: string) => {
    // Удаляем предыдущее уведомление
    if (currentToastId !== null) {
      toast.remove(currentToastId.toString());
    }
    const user = userStore.usersList.find((user) => sender === user._id);
    // Показываем новое уведомление
    const currentToast = toast.add({
      title: user?.username,
      description: 'Новое сообщение',
      icon: 'i-heroicons-chat-bubble-left-ellipsis',
      timeout: 5000,
      actions: [
        {
          label: 'Открыть',
          click: () => {
            openRoom(roomId);
            toggleChat();
          },
        },
      ],
      ui: {
        title: 'max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis',
      },
    });
    currentToastId = currentToast.id;
  };

  const loadMessages = async (page: number = 1) => {
    if (!state.currentRoom || state.isLoading || (!state.hasMoreMessages && page > 1)) return;

    state.isLoading = true;
    try {
      const response = await chatApi.getMessages(state.currentRoom._id, page);

      if (response.data?.messages) {
        // Создаем Map с правильной типизацией
        const uniqueMessages = new Map<string, ChatMessage>();

        // Добавляем существующие сообщения
        state.messages.forEach((msg) => {
          uniqueMessages.set(msg._id, msg);
        });

        // Добавляем новые сообщения
        response.data.messages.forEach((msg) => {
          uniqueMessages.set(msg._id, msg);
        });

        // Преобразуем Map в массив и сортируем
        state.messages = Array.from(uniqueMessages.values()).sort((a, b) => b.timestamp - a.timestamp);

        state.hasMoreMessages = page < (response.data.totalPages || 1);
        state.currentPage = page;
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to load messages';
    } finally {
      state.isLoading = false;
    }
  };

  // Rooms
  const addRoom = (room: ChatRoom) => {
    const index = state.rooms.findIndex((r) => r._id === room._id);
    if (index !== -1) {
      state.rooms[index] = room;
    } else {
      state.rooms.push(room);
    }
  };

  const fetchRooms = async () => {
    state.isLoading = true;
    try {
      const response = await chatApi.getRooms();
      if (response.data) {
        state.rooms = response.data;
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to fetch rooms';
    } finally {
      state.isLoading = false;
    }
  };

  const createOrGetRoom = async ({
    userId,
    chatSetting,
    recipientId,
    recipientUsername,
    recipientChatSetting,
  }: any) => {
    try {
      if (!userStore.user) return;

      const response = await chatApi.createOrGetRoom({
        userId,
        username: userStore.user.username,
        chatSetting,
        recipientId,
        recipientUsername,
        recipientChatSetting,
      });

      if (response.data) {
        addRoom(response.data);
        await openRoom(response.data._id);
        return response.data;
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to create room';
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      if (!userStore.user?._id) return;

      const response = await chatApi.deleteRoom(roomId);

      if (response.error) {
        // Если это текущая открытая комната, закрываем её
        if (state.currentRoom?._id === roomId) {
          closeChat();
        }
        // Удаляем комнату из списка
        state.rooms = [...state.rooms.filter((room) => room._id !== roomId)];
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to delete room';
    }
  };

  // Current room & messages
  const openRoom = async (roomId: string) => {
    try {
      const room = state.rooms.find((r) => r._id === roomId);
      if (!room) return;

      if (privateChatSSE.value) {
        privateChatSSE.value.closeSSE();
        privateChatSSE.value = null;
      }

      state.currentRoom = room;
      state.messages = [];
      state.currentPage = 1;
      state.hasMoreMessages = true;

      await loadMessages(1);

      const sse = usePrivateChatSSE(roomId, handleNewMessage);
      privateChatSSE.value = sse;
      sse.setupSSE();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to open room';
    }
  };

  const sendMessage = async (content: string) => {
    if (!state.currentRoom || !content.trim()) return;

    try {
      const response = await chatApi.sendMessage(state.currentRoom._id, content);
      if (response.data) {
        handleNewMessage(response.data);
      }
      return response.data;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to send message';
    }
  };

  const handleNewMessage = (message: ChatMessage) => {
    // Создаем Map с правильными парами [id, message]
    const uniqueMessages = new Map(state.messages.map((msg) => [msg._id, msg] as [string, ChatMessage]));

    // Добавляем новое сообщение
    uniqueMessages.set(message._id, message);

    // Обновляем state
    state.messages = Array.from(uniqueMessages.values()).sort((a, b) => b.timestamp - a.timestamp);

    // Обновляем информацию в комнате
    const room = state.rooms.find((r) => r._id === message.roomId);
    if (room) {
      room.lastMessage = message;
      room.lastMessageAt = new Date(message.timestamp);
    }
  };

  const notifyNewMessage = () => {};

  // UI state
  const toggleChat = () => {
    state.isOpen = !state.isOpen;
  };

  const closeChat = () => {
    // Закрываем SSE соединение при закрытии чата
    if (privateChatSSE.value) {
      console.log('Closing SSE connection on chat close');
      privateChatSSE.value.closeSSE();
      privateChatSSE.value = null;
    }
    state.isOpen = false;
    state.currentRoom = null;
  };

  onBeforeUnmount(() => {
    if (privateChatSSE.value) {
      console.log('Closing SSE connection on store unmount');
      privateChatSSE.value.closeSSE();
      privateChatSSE.value = null;
    }
  });

  onMounted(fetchRooms);

  return {
    ...toRefs(state),
    sortedRooms,
    currentUserId,
    showMessageNotification,
    loadMessages,
    addRoom,
    fetchRooms,
    createOrGetRoom,
    deleteRoom,
    openRoom,
    sendMessage,
    handleNewMessage,
    toggleChat,
    closeChat,
  };
});
