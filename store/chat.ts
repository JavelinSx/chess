import { defineStore } from 'pinia';
import { chatApi } from '~/shared/api/chat';
import { useUserStore } from './user';
import type { ClientChatRoom, ClientChatMessage } from '~/server/types/chat';

export const useChatStore = defineStore('chat', {
  state: () => ({
    chatRooms: {} as Record<string, ClientChatRoom>,
    messages: {} as Record<string, ClientChatMessage[]>,
    currentRoomId: null as string | null,
    isChatOpen: false,
    isLoading: false,
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
    async initializeChat(userId: string) {
      const response = await chatApi.getChatRooms(userId);
      if (response.data) {
        response.data.forEach((room) => {
          this.chatRooms[room.id] = room;
        });
      }
    },
    handleNewMessage(message: ClientChatMessage) {
      const roomId = `${message.senderId}-${message.receiverId}`;
      if (!this.messages[roomId]) {
        this.messages[roomId] = [];
      }
      this.messages[roomId].push(message);

      if (this.chatRooms[roomId]) {
        this.chatRooms[roomId].lastMessage = message;
        this.chatRooms[roomId].unreadCount += 1;
      } else {
        this.chatRooms[roomId] = {
          id: roomId,
          participantIds: [message.senderId, message.receiverId],
          lastMessage: message,
          unreadCount: 1,
        };
      }
    },
    handleRoomUpdate(room: ClientChatRoom) {
      this.chatRooms[room.id] = room;
    },
    handleReadStatus(roomId: string, userId: string) {
      const room = this.chatRooms[roomId];
      if (room) {
        room.unreadCount = 0;
        if (room.lastMessage && room.lastMessage.senderId === userId) {
          room.lastMessage.status = 'read';
        }
      }
      if (this.messages[roomId]) {
        this.messages[roomId].forEach((msg) => {
          if (msg.senderId === userId) {
            msg.status = 'read';
          }
        });
      }
    },
    async sendMessage(content: string) {
      if (!this.currentRoomId) return;
      const room = this.chatRooms[this.currentRoomId];
      if (!room) return;

      const userStore = useUserStore();
      const [senderId, receiverId] = room.participantIds;
      const response = await chatApi.sendMessage(senderId, receiverId, content);
      if (response.data) {
        this.handleNewMessage(response.data);
      }
    },
    async getMessages(roomId: string) {
      this.isLoading = true;
      try {
        const response = await chatApi.getMessages(roomId);
        if (response.data) {
          this.messages[roomId] = response.data;
        }
      } finally {
        this.isLoading = false;
      }
    },
    async openChat(userId: string) {
      if (!userId) {
        console.error('Invalid userId provided to openChat');
        return;
      }
      this.isLoading = true;
      try {
        const userStore = useUserStore();
        const currentUserId = userStore.user?._id;
        if (!currentUserId) {
          throw new Error('Current user not found');
        }
        let room = Object.values(this.chatRooms).find(
          (r) => r.participantIds.includes(userId) && r.participantIds.includes(currentUserId)
        );
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
        this.isChatOpen = true;
        await this.getMessages(room.id);
      } catch (error) {
        console.error('Error in openChat:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    closeChat() {
      this.currentRoomId = null;
      this.isChatOpen = false;
    },
    async markAsRead(roomId: string) {
      const room = this.chatRooms[roomId];
      if (room) {
        room.unreadCount = 0;
        await chatApi.markAsRead(roomId);
      }
    },
  },
});
