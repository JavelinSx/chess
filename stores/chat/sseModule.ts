import type { ChatStoreState } from './types';

export const useSSEModule = (state: ChatStoreState) => {
  const handlePrivateChatConnection = async (roomId: string, userId: string) => {
    if (state.privateChatConnection?.roomId === roomId) return;
    state.privateChatConnection = { roomId, userId };
  };

  const handleRoomsConnection = async (userId: string) => {
    if (state.roomsConnection === userId) return;
    state.roomsConnection = userId;
  };

  const disconnectAll = async () => {
    state.privateChatConnection = null;
    state.roomsConnection = null;
  };

  return {
    handlePrivateChatConnection,
    handleRoomsConnection,
    disconnectAll,
  };
};
