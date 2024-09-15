import { defineStore } from 'pinia';
import { chatApi } from '~/shared/api/chat';
import { useUserStore } from './user';
import type { IChatRoom, ChatMessage, UserChatMessage } from '~/server/types/chat';

export const useChatStore = defineStore('chat', {
  state: () => ({
    rooms: {} as Record<string, IChatRoom>,
    currentRoom: null as IChatRoom | null,
    activeRoomId: null as string | null,
    isOpen: false,
    error: null as string | null,
    isLoading: false,
    currentUserId: null as string | null,
    currentPage: 1,
    totalPages: 1,
    messageLimit: 50,
    totalMessages: 0,
    locales: useI18n(),
  }),

  getters: {
    activeRoom: (state) => state.currentRoom,
    sortedRooms: (state) => {
      const roomsArray = Object.values(state.rooms);
      return roomsArray.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    },
    sortedMessages: (state) => {
      if (!state.currentRoom) return [];
      return [...(state.currentRoom.messages || [])].sort((a, b) => a.timestamp - b.timestamp);
    },
    hasMoreMessages: (state) => {
      return state.currentRoom ? state.currentRoom.messages.length < state.currentRoom.messageCount : false;
    },
  },

  actions: {
    async loadMoreMessages() {
      if (!this.activeRoomId || this.isLoading) return;

      this.isLoading = true;
      try {
        const response = await chatApi.getRoomMessages(this.activeRoomId, this.currentPage + 1);
        if (response.data) {
          const { messages, totalCount, currentPage, totalPages } = response.data;
          const room = this.rooms[this.activeRoomId];
          room.messages.unshift(...messages);
          this.totalMessages = totalCount;
          this.currentPage = currentPage;
          this.totalPages = totalPages;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : this.locales.t('failedToLoadMessages');
      } finally {
        this.isLoading = false;
      }
    },

    async setActiveRoom(roomId: string | null) {
      this.activeRoomId = roomId;
      this.resetPagination();
      if (roomId && this.rooms[roomId]) {
        this.isLoading = true;
        try {
          const response = await chatApi.getRoomMessages(roomId, 1, this.messageLimit);
          if (response.data) {
            const { messages, totalCount, currentPage, totalPages } = response.data;
            this.rooms[roomId].messages = messages;
            this.rooms[roomId].messageCount = totalCount;
            this.currentPage = currentPage;
            this.totalPages = totalPages;
            this.currentRoom = this.rooms[roomId];
          } else if (response.error) {
            this.error = response.error;
          }
        } catch (error) {
          this.error = error instanceof Error ? error.message : this.locales.t('failedToFetchRoomMessages');
        } finally {
          this.isLoading = false;
        }
      } else {
        this.currentRoom = null;
      }
    },

    async createOrGetRoom(currentUser: UserChatMessage, otherUser: UserChatMessage) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await chatApi.createOrGetRoom(
          { _id: currentUser._id, username: currentUser.username },
          { _id: otherUser._id, username: otherUser.username }
        );
        if (response.data) {
          const room = response.data.room;
          this.rooms[room._id.toString()] = room;
          await this.setActiveRoom(room._id.toString());
          this.currentUserId = currentUser._id;
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : this.locales.t('failedToCreateOrGetRoom');
      } finally {
        this.isLoading = false;
      }
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
        this.error = error instanceof Error ? error.message : this.locales.t('failedToFetchRooms');
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessage(content: string) {
      if (!this.activeRoomId) {
        this.error = this.locales.t('noActiveRoom');
        return;
      }

      const userStore = useUserStore();
      if (!userStore.user) {
        this.error = this.locales.t('userNotAuthenticated');
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
        this.error = error instanceof Error ? error.message : this.locales.t('failedToSendMessage');
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
        this.rooms[roomId].lastMessage = message;
        this.rooms[roomId].lastMessageAt = new Date(message.timestamp);
        this.rooms[roomId].messageCount++;
      }
    },

    addRoom(room: IChatRoom) {
      this.rooms[room._id.toString()] = room;
    },

    resetPagination() {
      this.currentPage = 1;
      this.totalPages = 1;
    },

    toggleChat() {
      this.isOpen = !this.isOpen;
    },

    closeChat() {
      this.isOpen = false;
      this.activeRoomId = null;
      this.resetPagination();
    },
  },
});
