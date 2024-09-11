// store/chat.ts
import { defineStore } from 'pinia';
import { chatApi } from '~/shared/api/chat';
import { useUserStore } from './user';
import type { IChatRoom, ChatMessage, UserChatMessage } from '~/server/types/chat';

export const useChatStore = defineStore('chat', {
  state: () => ({
    rooms: {} as Record<string, IChatRoom>,
    activeRoomId: null as string | null,
    isOpen: false,
    error: null as string | null,
    isLoading: false,
    currentUserId: null as string | null,
  }),

  getters: {
    activeRoom: (state) => (state.activeRoomId ? state.rooms[state.activeRoomId] : null),
    sortedRooms: (state) => {
      return Object.values(state.rooms).sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    },
    sortedMessages: (state) => {
      if (!state.activeRoomId || !state.rooms[state.activeRoomId]) return [];
      return [...state.rooms[state.activeRoomId].messages].sort((a, b) => a.timestamp - b.timestamp);
    },
  },

  actions: {
    async createOrGetRoom(currentUser: UserChatMessage, otherUser: UserChatMessage) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await chatApi.createOrGetRoom(
          { _id: currentUser._id, username: currentUser.username },
          { _id: otherUser._id, username: otherUser.username }
        );
        if (response.data) {
          const room = response.data;
          this.rooms[room._id.toString()] = room;
          this.setActiveRoom(room._id.toString());
          this.currentUserId = currentUser._id;
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create or get room';
      } finally {
        this.isLoading = false;
      }
    },

    setActiveRoom(roomId: string | null) {
      this.activeRoomId = roomId;
    },

    async fetchRooms() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await chatApi.getRooms();
        if (response.data) {
          this.rooms = response.data.reduce((acc, room) => {
            acc[room._id.toString()] = room;
            return acc;
          }, {} as Record<string, IChatRoom>);
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch rooms';
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessage(content: string) {
      if (!this.activeRoomId) {
        this.error = 'No active room';
        return;
      }

      const userStore = useUserStore();
      if (!userStore.user) {
        this.error = 'User not authenticated';
        return;
      }

      this.isLoading = true;
      this.error = null;
      try {
        const response = await chatApi.sendMessage(this.activeRoomId, content);
        if (response.error) {
          this.error = response.error;
        }
        // Сообщение будет добавлено через SSE
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to send message';
      } finally {
        this.isLoading = false;
      }
    },
    addMessageToRoom(roomId: string, message: ChatMessage) {
      if (this.rooms[roomId]) {
        if (!this.rooms[roomId].messages) {
          this.rooms[roomId].messages = [];
        }
        this.rooms[roomId].messages.push(message);
        this.rooms[roomId].lastMessageAt = new Date(message.timestamp);
      }
    },

    addRoom(room: IChatRoom) {
      this.rooms[room._id.toString()] = room;
    },
    toggleChat() {
      this.isOpen = !this.isOpen;
    },

    closeChat() {
      this.isOpen = false;
      this.activeRoomId = null;
    },
  },
});
