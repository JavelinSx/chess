import { defineStore } from 'pinia';
import { chatApi } from '~/shared/api/chat';
import { useUserStore } from './user';
import type { ClientChatRoom, ClientChatMessage } from '~/server/types/chat';

export const useChatStore = defineStore('chat', {
  state: () => ({
    chatRooms: {} as Record<string, ClientChatRoom>,
    currentRoomId: null as string | null,
    isChatOpen: false,
    isLoading: false,
    currentChatPartnerId: null as string | null,
  }),

  getters: {
    currentChatUserId(): string | null {
      if (!this.currentRoomId) return null;
      const currentRoom = this.chatRooms[this.currentRoomId];
      if (!currentRoom) return null;
      const userStore = useUserStore();
      return currentRoom.participantIds.find((id) => id !== userStore.user?._id) || null;
    },
    currentMessages(): ClientChatMessage[] {
      return this.currentRoomId ? this.chatRooms[this.currentRoomId]?.messages || [] : [];
    },
    currentRoom(): ClientChatRoom | null {
      return this.currentRoomId ? this.chatRooms[this.currentRoomId] || null : null;
    },
  },

  actions: {
    async initializeChat(userId: string) {
      const response = await chatApi.getChatRooms(userId);
      if (response.data) {
        this.chatRooms = response.data.reduce((acc, room) => {
          acc[room.id] = room;
          return acc;
        }, {} as Record<string, ClientChatRoom>);
      }
    },

    async openChat(userId: string) {
      console.log('openChat called with userId:', userId);
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

        console.log('Current user ID:', currentUserId);

        let room = Object.values(this.chatRooms).find(
          (r) => r.participantIds.includes(currentUserId) && r.participantIds.includes(userId)
        );

        if (!room) {
          console.log('Room not found, creating new one');
          const response = await chatApi.createChatRoom(userId);
          if (response.data) {
            room = response.data;
            this.chatRooms[room.id] = room;
          } else {
            throw new Error(response.error || 'Failed to create chat room');
          }
        }

        console.log('Room after creation/retrieval:', JSON.stringify(room, null, 2));

        this.currentRoomId = room.id;
        this.currentChatPartnerId = userId;
        this.isChatOpen = true;
        await this.getMessages(room.id);

        console.log('Final chat state:', {
          currentRoomId: this.currentRoomId,
          currentChatPartnerId: this.currentChatPartnerId,
          isChatOpen: this.isChatOpen,
          messages: this.currentMessages,
        });
      } catch (error) {
        console.error('Error in openChat:', error);
        this.isChatOpen = false;
        this.currentChatPartnerId = null;
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessage(content: string) {
      if (!this.currentRoomId || !this.currentChatPartnerId) {
        console.error('No active chat room or chat partner');
        return;
      }
      const userStore = useUserStore();
      const currentUserId = userStore.user?._id;
      if (!currentUserId) {
        console.error('Current user not found');
        return;
      }

      try {
        console.log('Sending message:', content, 'to:', this.currentChatPartnerId, 'in room:', this.currentRoomId);
        const response = await chatApi.sendMessage(
          this.currentRoomId,
          currentUserId,
          this.currentChatPartnerId,
          content
        );
        if (response.data) {
          console.log('Message sent successfully:', response.data);
          this.handleNewMessage(response.data);
        } else {
          console.error('Failed to send message:', response.error);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },

    handleNewMessage(message: ClientChatMessage) {
      const roomId = this.currentRoomId;
      if (!roomId) {
        console.error('No active chat room');
        return;
      }

      if (!this.chatRooms[roomId]) {
        console.error('Chat room not found:', roomId);
        return;
      }

      this.chatRooms[roomId].messages.push(message);
      this.chatRooms[roomId].lastMessage = message;
      this.chatRooms[roomId].unreadCount += 1;

      if (this.currentRoomId === roomId) {
        this.markAsRead(roomId);
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
        room.messages.forEach((msg) => {
          if (msg.senderId === userId) {
            msg.status = 'read';
          }
        });
      }
    },

    async getMessages(roomId: string) {
      this.isLoading = true;
      try {
        const response = await chatApi.getMessages(roomId);
        if (response.data && this.chatRooms[roomId]) {
          this.chatRooms[roomId].messages = response.data;
        }
      } finally {
        this.isLoading = false;
      }
    },

    closeChat() {
      console.log('Closing chat');
      this.currentRoomId = null;
      this.currentChatPartnerId = null;
      this.isChatOpen = false;
      console.log(
        'Chat closed, isChatOpen:',
        this.isChatOpen,
        'currentRoomId:',
        this.currentRoomId,
        'currentChatPartnerId:',
        this.currentChatPartnerId
      );
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
