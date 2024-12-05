import type { ChatMessage } from '~/server/services/chat/types';
import type { ChatStoreState } from './types';
import { useUserStore } from '~/stores/user';
import { chatApi } from '~/shared/api/chat';

// stores/chat/messagesModule.ts
export const useMessagesModule = (state: ChatStoreState) => {
  const addMessageToRoom = (roomId: string, message: ChatMessage) => {
    const room = state.rooms.find((r) => r._id === roomId);
    if (room) {
      if (!room.messages) room.messages = [];
      room.messages.push(message);
      room.lastMessage = message;
      room.lastMessageAt = new Date();
      room.messageCount++;

      if (state.currentRoom && state.currentRoom._id === roomId) {
        state.currentRoom = room;
      }

      if (!state.isOpen) {
        state.unreadMessagesCount++;
      }
    }
  };

  const sendMessage = async (roomId: string, content: string) => {
    const userStore = useUserStore();
    const currentUser = userStore.user;
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    try {
      const response = await chatApi.sendMessage(roomId, currentUser._id, content, currentUser.username);
      return { success: !!response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  };

  return {
    addMessageToRoom,
    sendMessage,
  };
};
