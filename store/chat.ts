import { defineStore } from 'pinia';
import { chatApi } from '~/shared/api/chat';
import { useUserStore } from './user';
import type { ClientChatRoom, ClientChatMessage } from '~/server/types/chat';

export const useChatStore = defineStore('chat', {
  state: () => ({
    chatRooms: {} as Record<string, ClientChatRoom>,
    messages: {} as Record<string, ClientChatMessage[]>,
    currentRoomId: null as string | null,
    isLoading: false,
    error: null as string | null,
    isChatOpen: false,
  }),

  getters: {
    currentChatUserId(): string | null {
      if (!this.currentRoomId) return null;
      const currentRoom = this.chatRooms[this.currentRoomId];
      if (!currentRoom) return null;
      const userStore = useUserStore();
      return currentRoom.participantIds.find((id) => id !== userStore.user?._id) || null;
    },
  },

  actions: {
    async initializeChat() {
      this.isLoading = true;
      try {
        const userStore = useUserStore();
        if (!userStore.user?._id) throw new Error('User not authenticated');
        const response = await chatApi.getChatRooms(userStore.user._id);
        if (response.data) {
          this.chatRooms = response.data.reduce((acc, room) => {
            acc[room.id] = room;
            return acc;
          }, {} as Record<string, ClientChatRoom>);
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to initialize chat';
      } finally {
        this.isLoading = false;
      }
    },

    async openChat(userId: string) {
      this.isLoading = true;
      try {
        let room = Object.values(this.chatRooms).find((room) => room.participantIds.includes(userId));
        if (!room) {
          const response = await chatApi.createChatRoom(userId);
          if (response.data) {
            room = response.data;
            this.chatRooms[room.id] = room;
          } else {
            throw new Error(response.error || 'Failed to create chat room');
          }
        }
        this.currentRoomId = room.id;
        await this.loadMessages(room.id);
        this.isChatOpen = true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to open chat';
      } finally {
        this.isLoading = false;
      }
    },

    closeChat() {
      this.currentRoomId = null;
      this.isChatOpen = false;
    },

    async loadMessages(roomId: string) {
      this.isLoading = true;
      try {
        const response = await chatApi.getMessages(roomId);
        if (response.data) {
          this.messages[roomId] = response.data;
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load messages';
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessage(content: string) {
      if (!this.currentRoomId) throw new Error('No active chat room');
      const userStore = useUserStore();
      if (!userStore.user?._id) throw new Error('User not authenticated');

      try {
        const room = this.chatRooms[this.currentRoomId];
        const receiverId = room.participantIds.find((id) => id !== userStore.user?._id);
        if (!receiverId) throw new Error('Receiver not found');

        const response = await chatApi.sendMessage(userStore.user._id, receiverId, content);
        if (response.data) {
          if (!this.messages[this.currentRoomId]) {
            this.messages[this.currentRoomId] = [];
          }
          this.messages[this.currentRoomId].push(response.data);
          this.updateRoomWithLastMessage(this.currentRoomId, response.data);
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to send message';
      }
    },

    updateRoomWithLastMessage(roomId: string, message: ClientChatMessage) {
      if (this.chatRooms[roomId]) {
        this.chatRooms[roomId].lastMessage = message;
        this.chatRooms[roomId].unreadCount += 1;
      }
    },

    async markAsRead(roomId: string) {
      try {
        await chatApi.markAsRead(roomId);
        if (this.chatRooms[roomId]) {
          this.chatRooms[roomId].unreadCount = 0;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to mark messages as read';
      }
    },

    // Метод для обработки входящих сообщений через SSE
    handleIncomingMessage(message: ClientChatMessage) {
      const roomId = message.senderId + '-' + message.receiverId;
      if (!this.messages[roomId]) {
        this.messages[roomId] = [];
      }
      this.messages[roomId].push(message);
      this.updateRoomWithLastMessage(roomId, message);
    },
  },
});
