import { useUserStore } from '~/stores/user';
import { useMessagesModule } from './messageModule';
import { usePrivacyModule } from './privacyModule';
import { useRoomsModule } from './roomsModule';
import type { ChatStoreState } from './types';
import { chatApi } from '~/shared/api/chat';
import { useSSEModule } from './sseModule';
import type { ChatMessage } from '~/server/services/chat/types';

export const useChatStore = defineStore('chat', () => {
  const state = reactive<ChatStoreState>({
    rooms: [],
    blockedRooms: new Set(),
    currentRoom: null,
    activeRoomId: null,
    isOpen: false,
    error: null,
    isLoading: false,
    currentUserId: null,
    unreadMessagesCount: 0,
    privateChatConnection: null,
  });

  const sseModule = useSSEModule(state);
  const roomsModule = useRoomsModule(state, sseModule);
  const messagesModule = useMessagesModule(state);
  const privacyModule = usePrivacyModule(state);

  const sortedRooms = computed(() =>
    [...state.rooms].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
  );

  const sortedMessages = computed(
    () => state.currentRoom?.messages.slice().sort((a, b) => a.timestamp - b.timestamp) || []
  );

  const init = async () => {
    const userStore = useUserStore();
    if (!userStore.user) return;

    state.currentUserId = userStore.user._id;
    await fetchRooms();
  };

  const handleNewMessage = (message: ChatMessage) => {
    messagesModule.addMessageToRoom(message.roomId, message);
  };

  const fetchRooms = async () => {
    const userStore = useUserStore();
    if (!userStore.user) return;

    state.isLoading = true;
    try {
      const response = await chatApi.getRooms();
      if (response.data) {
        state.rooms = response.data;
        privacyModule.updateBlockedRooms();
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to fetch rooms';
    } finally {
      state.isLoading = false;
    }
  };

  const toggleChat = () => {
    state.isOpen = !state.isOpen;
    if (state.isOpen) {
      state.unreadMessagesCount = 0;
    }
  };

  const closeChat = async () => {
    state.isOpen = false;
    await roomsModule.setActiveRoom(null);
    await sseModule.disconnectAll();
  };

  return {
    ...toRefs(state),
    ...sseModule,
    sortedRooms,
    sortedMessages,
    ...roomsModule,
    ...messagesModule,
    ...privacyModule,
    init,
    handleNewMessage,
    fetchRooms,
    toggleChat,
    closeChat,
  };
});
