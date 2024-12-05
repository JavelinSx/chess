import type { ChatSetting } from '~/server/types/user';
import type { ChatStoreState } from './types';
import { useUserStore } from '~/stores/user';

export const usePrivacyModule = (state: ChatStoreState) => {
  const checkCanInteract = (
    currentUserSetting: ChatSetting,
    otherUserSetting: ChatSetting,
    otherUserId: string
  ): boolean => {
    const userStore = useUserStore();

    if (currentUserSetting === 'nobody' || otherUserSetting === 'nobody') {
      return false;
    }

    if (currentUserSetting === 'friends_only' || otherUserSetting === 'friends_only') {
      return userStore.user?.friends.some((friend) => friend._id === otherUserId) || false;
    }

    return true;
  };

  const updateBlockedRooms = () => {
    state.rooms.forEach((room) => {
      const otherParticipant = room.participants.find((p) => p.userId !== state.currentUserId);
      if (otherParticipant) {
        const canInteract = checkCanInteract(
          room.participants[0].chatSetting,
          room.participants[1].chatSetting,
          otherParticipant.userId
        );
        if (!canInteract) {
          state.blockedRooms.add(String(room._id));
        }
      }
    });
  };

  return {
    checkCanInteract,
    updateBlockedRooms,
  };
};
