import { usePrivateChatSSE } from '~/composables/chat/usePrivateChatSSE';
import type { ChatStoreState } from './types';
import { useChatRoomsSSE } from '~/composables/chat/useChatRoomsSSE';

export const useSSEModule = (state: ChatStoreState) => {
  const handlePrivateChatConnection = async (roomId: string, userId: string) => {
    // Если уже есть соединение с этой комнатой - игнорируем
    if (state.privateChatConnection?.roomId === roomId) {
      return;
    }

    // Устанавливаем новое соединение
    const { setupSSE, closeSSE } = usePrivateChatSSE(roomId);
    await setupSSE();

    state.privateChatConnection = {
      roomId,
      userId,
      connection: closeSSE, // Сохраняем функцию закрытия соединения
    };
  };

  const disconnectAll = async () => {
    // Закрываем приватное соединение если есть
    if (state.privateChatConnection?.connection) {
      state.privateChatConnection.connection();
    }
    state.privateChatConnection = null;
  };

  return {
    handlePrivateChatConnection,
    disconnectAll,
  };
};
