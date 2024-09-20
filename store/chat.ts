import { defineStore } from 'pinia';
import { chatApi } from '~/shared/api/chat';
import { useUserStore } from './user';
import type { IChatRoom, ChatMessage, UserChatMessage } from '~/server/types/chat';

export const useChatStore = defineStore('chat', {
  state: () => ({
    rooms: {} as Record<string, IChatRoom>,
    blockedRooms: new Set<string>(),
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
    unreadMessagesCount: 0,
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
    isRoomBlocked: (state) => (roomId: string) => state.blockedRooms.has(roomId),
  },

  actions: {
    async loadMoreMessages() {
      if (!this.activeRoomId || this.isLoading) return;

      this.isLoading = true;
      try {
        const response = await chatApi.getRoomMessages(this.activeRoomId, this.currentPage + 1);
        if (response.data) {
          const { messages, totalCount, currentPage, totalPages, isBlocked } = response.data;
          const room = this.rooms[this.activeRoomId];
          room.messages.unshift(...messages);
          this.totalMessages = totalCount;
          this.currentPage = currentPage;
          this.totalPages = totalPages;

          if (isBlocked) {
            this.blockedRooms.add(this.activeRoomId);
          } else {
            this.blockedRooms.delete(this.activeRoomId);
          }
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
            const { messages, totalCount, currentPage, totalPages, isBlocked } = response.data;
            this.rooms[roomId].messages = messages;
            this.rooms[roomId].messageCount = totalCount;
            this.currentPage = currentPage;
            this.totalPages = totalPages;
            this.currentRoom = this.rooms[roomId];

            if (isBlocked) {
              this.blockedRooms.add(roomId);
            } else {
              this.blockedRooms.delete(roomId);
            }
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
        this.error = this.locales.t('failedToCreateOrGetRoom');
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
            if (room.isBlocked) {
              this.blockedRooms.add(room._id.toString());
            } else {
              this.blockedRooms.delete(room._id.toString());
            }
            return acc;
          }, {} as Record<string, IChatRoom>);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : this.locales.t('failedToFetchRooms');
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessage(roomId: string, content: string) {
      if (!this.activeRoomId) {
        this.error = this.locales.t('noActiveRoom');
        return;
      }
      if (this.blockedRooms.has(roomId)) {
        this.error = this.locales.t('cannotSendMessagePrivacy');
        return;
      }
      this.isLoading = true;
      this.error = null;

      try {
        const response = await chatApi.sendMessage(roomId, content);
        if (response.data) {
          this.addMessageToRoom(roomId, response.data);
        } else if (response.error) {
          if (response.error.includes('privacy settings')) {
            this.blockedRooms.add(roomId);
            this.error = this.locales.t('cannotSendMessagePrivacy');
          } else {
            this.error = response.error;
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'User not authenticated') {
            this.error = this.locales.t('userNotAuthenticated');
          } else if (error.message.includes('privacy settings')) {
            this.blockedRooms.add(roomId);
            this.error = this.locales.t('cannotSendMessagePrivacy');
          } else {
            this.error = error.message;
          }
        } else {
          this.error = this.locales.t('failedToSendMessage');
        }
      } finally {
        this.isLoading = false;
      }
    },

    async deleteRoom(roomId: string) {
      try {
        const response = await chatApi.deleteRoom(roomId);
        if (response.data && response.data.success) {
          delete this.rooms[roomId];
          if (this.activeRoomId === roomId) {
            this.activeRoomId = null;
            this.currentRoom = null;
          }
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : this.locales.t('failedToDeleteRoom');
      }
    },

    incrementUnreadMessages() {
      this.unreadMessagesCount++;
    },

    resetUnreadMessages() {
      this.unreadMessagesCount = 0;
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

        if (this.currentRoom && this.currentRoom._id.toString() === roomId) {
          this.currentRoom = this.rooms[roomId];
        }

        if (!this.isOpen) {
          this.incrementUnreadMessages();
        }
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
      this.resetUnreadMessages();
      if (this.isOpen && !this.activeRoomId) {
        this.fetchRooms();
      }
    },

    closeChat() {
      this.isOpen = false;
      this.activeRoomId = null;
      this.resetPagination();
    },
  },
});
