import type { ChatRoom } from '~/server/services/chat/types';
import type { ChatStoreState } from './types';
import { chatApi } from '~/shared/api/chat';
import { useSSEModule } from './sseModule';
import { usePrivacyModule } from './privacyModule';
// roomsModule.ts
export const useRoomsModule = (state: ChatStoreState, sseModule: ReturnType<typeof useSSEModule>) => {
  const addRoom = (room: ChatRoom) => {
    const existingIndex = state.rooms.findIndex((r) => String(r._id) === String(room._id));
    if (existingIndex !== -1) {
      state.rooms[existingIndex] = room;
    } else {
      state.rooms.push(room);
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      const response = await chatApi.deleteRoom(roomId);
      if (response.data !== null) {
        state.rooms = state.rooms.filter((room) => String(room._id) !== roomId);
        state.blockedRooms.delete(roomId);

        if (state.activeRoomId === roomId) {
          state.activeRoomId = null;
          state.currentRoom = null;
        }
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to delete room';
    }
  };

  const setActiveRoom = async (roomId: string | null) => {
    const userStore = useUserStore();
    if (!userStore.user) return;

    state.activeRoomId = roomId;

    if (!roomId) {
      state.currentRoom = null;
      if (state.privateChatConnection) {
        await sseModule.disconnectAll();
      }
      return;
    }

    await sseModule.handlePrivateChatConnection(roomId, userStore.user._id);

    const room = state.rooms.find((r) => String(r._id) === roomId);
    if (!room) return;

    const response = await chatApi.getMessages(roomId);
    if (!response.data) return;

    const { messages, isBlocked } = response.data;
    room.messages = messages;
    state.currentRoom = room;

    const privacyModule = usePrivacyModule(state);
    const otherParticipant = room.participants.find((p) => p.userId !== state.currentUserId);

    if (
      otherParticipant &&
      !privacyModule.checkCanInteract(
        room.participants[0].chatSetting,
        room.participants[1].chatSetting,
        otherParticipant.userId
      )
    ) {
      state.blockedRooms.add(roomId);
      return;
    }

    isBlocked ? state.blockedRooms.add(roomId) : state.blockedRooms.delete(roomId);
  };

  return {
    addRoom,
    deleteRoom,
    setActiveRoom,
  };
};
