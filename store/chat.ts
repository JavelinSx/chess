import { defineStore } from 'pinia';
import { chatApi } from '~/shared/api/chat';
import { useUserStore } from './user';
import type { IChatRoom, ChatMessage, UserChatMessage, ChatParticipant } from '~/server/types/chat';
import type { ClientUser, ChatSetting } from '~/server/types/user';
import type { RoomRequestParams } from '~/shared/api/chat';

export const useChatStore = defineStore('chat', {
  state: () => ({
    rooms: [] as IChatRoom[],
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
    currentUserChatSetting: null as string | null,
  }),

  getters: {
    activeRoom: (state) => state.currentRoom,
    sortedRooms: (state) => {
      return [...state.rooms].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
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
          const roomIndex = this.rooms.findIndex((r) => r._id.toString() === this.activeRoomId);
          if (roomIndex !== -1) {
            const updatedRoom = { ...this.rooms[roomIndex] };
            updatedRoom.messages = [...messages, ...(updatedRoom.messages || [])];
            updatedRoom.messageCount = totalCount;
            this.rooms[roomIndex] = updatedRoom;

            if (this.currentRoom && this.currentRoom._id.toString() === this.activeRoomId) {
              this.currentRoom = updatedRoom;
            }

            this.totalMessages = totalCount;
            this.currentPage = currentPage;
            this.totalPages = totalPages;

            if (isBlocked) {
              this.blockedRooms.add(this.activeRoomId);
            } else {
              this.blockedRooms.delete(this.activeRoomId);
            }
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
      if (roomId) {
        const room = this.rooms.find((r) => r._id.toString() === roomId);
        if (room) {
          this.isLoading = true;
          try {
            const response = await chatApi.getRoomMessages(roomId, 1, this.messageLimit);
            if (response.data) {
              const { messages, totalCount, currentPage, totalPages, isBlocked } = response.data;
              const updatedRoom = { ...room, messages, messageCount: totalCount };
              const roomIndex = this.rooms.findIndex((r) => r._id.toString() === roomId);
              this.rooms[roomIndex] = updatedRoom;
              this.currentPage = currentPage;
              this.totalPages = totalPages;
              this.currentRoom = updatedRoom;

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
      } else {
        this.currentRoom = null;
      }
    },

    async createOrGetRoom(
      currentUser: { _id: string; chatSetting: string },
      otherUser: { _id: string; chatSetting: string }
    ) {
      this.isLoading = true;
      this.error = null;
      try {
        const params: RoomRequestParams = {
          senderUserId: currentUser._id,
          recipientUserId: otherUser._id,
          chatSettingSender: currentUser.chatSetting,
          chatSettingRecipient: otherUser.chatSetting,
        };

        const response = await chatApi.createOrGetRoom(params);
        if (response.data) {
          const { room, canInteract } = response.data;
          if (room) {
            const existingRoomIndex = this.rooms.findIndex((r) => r._id.toString() === room._id.toString());
            if (existingRoomIndex !== -1) {
              this.rooms[existingRoomIndex] = room;
            } else {
              this.rooms.push(room);
            }
            await this.setActiveRoom(room._id.toString());
            this.currentUserId = currentUser._id;
          }
          if (!canInteract) {
            this.blockedRooms.add(room._id.toString());
          }
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
      const userStore = useUserStore();

      try {
        const currentUser = userStore.user;
        if (!currentUser) {
          throw new Error('User not authenticated');
        }
        if (this.rooms.length === 0) {
          const response = await chatApi.getRooms(currentUser._id, currentUser.chatSetting);

          if (response.data) {
            this.rooms = response.data;
            // Обновляем blockedRooms на основе полученных данных
            this.rooms.forEach((room) => {
              if (!room.canSendMessage) {
                this.blockedRooms.add(room._id.toString());
              }
            });
          } else if (response.error) {
            console.error('Error fetching rooms:', response.error);
            this.error = response.error;
          }
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : this.locales.t('failedToFetchRooms');
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessage(roomId: string, content: string): Promise<{ success: boolean; error?: string }> {
      if (!this.activeRoomId) {
        return { success: false, error: this.locales.t('noActiveRoom') };
      }

      const room = this.rooms.find((r) => r._id.toString() === roomId);
      if (!room) {
        return { success: false, error: this.locales.t('roomNotFound') };
      }

      const userStore = useUserStore();
      const currentUser = userStore.user;
      const otherParticipant = room.participants.find((p) => p._id.toString() !== currentUser?._id);

      if (!currentUser || !otherParticipant) {
        return { success: false, error: this.locales.t('cannotSendMessagePrivacy') };
      }

      this.isLoading = true;
      this.error = null;

      try {
        const response = await chatApi.sendMessage(roomId, content);
        if (response.data) {
          return { success: true };
        } else if (response.error) {
          this.error = response.error;
          return { success: false, error: this.error };
        }
        return { success: false, error: this.locales.t('unknownError') };
      } catch (error) {
        let errorMessage: string;
        if (error instanceof Error) {
          if (error.message === 'User not authenticated') {
            errorMessage = this.locales.t('userNotAuthenticated');
          } else if (error.message.includes('privacy settings')) {
            this.blockedRooms.add(roomId);
            errorMessage = this.locales.t('cannotSendMessagePrivacy');
          } else {
            errorMessage = error.message;
          }
        } else {
          errorMessage = this.locales.t('failedToSendMessage');
        }
        this.error = errorMessage;
        return { success: false, error: errorMessage };
      } finally {
        this.isLoading = false;
      }
    },

    async handleChatRoomUpdate(roomId: string) {
      // Проверяем, существует ли комната в текущем списке
      const roomIndex = this.rooms.findIndex((r) => r._id.toString() === roomId);
      if (roomIndex === -1) return; // Если комнаты нет, ничего не делаем

      try {
        const response = await chatApi.getRoomMessages(roomId, 1, this.messageLimit);
        if (response.data) {
          const { messages, totalCount, currentPage, totalPages, isBlocked } = response.data;

          // Обновляем существующую комнату вместо создания новой
          this.rooms[roomIndex] = {
            ...this.rooms[roomIndex],
            messages,
            messageCount: totalCount,
            isBlocked,
          };

          if (this.currentRoom && this.currentRoom._id.toString() === roomId) {
            this.currentRoom = this.rooms[roomIndex];
            this.currentPage = currentPage;
            this.totalPages = totalPages;
          }

          if (isBlocked) {
            this.blockedRooms.add(roomId);
          } else {
            this.blockedRooms.delete(roomId);
          }
        }
      } catch (error) {
        console.error('Error updating chat room:', error);
      }
    },
    checkCanInteract(currentUserSetting: ChatSetting, otherUserSetting: ChatSetting, otherUserId: string): boolean {
      const userStore = useUserStore();

      // Если у одного из пользователей установлено 'nobody', общение невозможно
      if (currentUserSetting === 'nobody' || otherUserSetting === 'nobody') {
        return false;
      }

      // Если у текущего пользователя 'friends_only', проверяем, является ли другой пользователь другом
      if (currentUserSetting === 'friends_only') {
        return userStore.user?.friends.some((friend) => friend._id === otherUserId) || false;
      }

      // Если у другого пользователя 'friends_only', проверяем, является ли текущий пользователь его другом
      if (otherUserSetting === 'friends_only') {
        return userStore.user?.friends.some((friend) => friend._id === otherUserId) || false;
      }

      // В остальных случаях (оба 'all' или комбинация 'all' и 'friends_only') разрешаем общение
      return true;
    },
    async deleteRoom(roomId: string) {
      try {
        const response = await chatApi.deleteRoom(roomId);
        if (response.data !== null) {
          this.rooms = this.rooms.filter((room) => room._id.toString() !== roomId);
          this.blockedRooms.delete(roomId);

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

    async refreshRooms() {
      await this.fetchRooms();
    },

    incrementUnreadMessages() {
      this.unreadMessagesCount++;
    },

    resetUnreadMessages() {
      this.unreadMessagesCount = 0;
    },

    addMessageToRoom(roomId: string, message: ChatMessage) {
      const roomIndex = this.rooms.findIndex((room) => room._id.toString() === roomId);
      if (roomIndex !== -1) {
        const updatedRoom = { ...this.rooms[roomIndex] };
        if (!updatedRoom.messages) {
          updatedRoom.messages = [];
        }
        updatedRoom.messages.push(message);
        updatedRoom.lastMessage = message;
        updatedRoom.lastMessageAt = new Date(message.timestamp);
        updatedRoom.messageCount++;

        this.rooms[roomIndex] = updatedRoom;

        if (this.currentRoom && this.currentRoom._id.toString() === roomId) {
          this.currentRoom = updatedRoom;
        }

        if (!this.isOpen) {
          this.incrementUnreadMessages();
        }
      }
    },

    addRoom(room: IChatRoom) {
      this.rooms.push(room);
    },

    resetPagination() {
      this.currentPage = 1;
      this.totalPages = 1;
    },

    toggleChat() {
      this.isOpen = !this.isOpen;
      this.resetUnreadMessages();
      if (this.isOpen && this.rooms.length === 0) {
        this.fetchRooms();
      }
    },

    closeChat() {
      this.isOpen = false;
      this.activeRoomId = null;
      this.currentRoom = null;
      this.resetPagination();
    },
  },
});
