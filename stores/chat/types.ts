// stores/chat/types.ts
import type { ChatRoom } from '~/server/services/chat/types';

export interface ChatStoreState {
  rooms: ChatRoom[];
  blockedRooms: Set<string>;
  currentRoom: ChatRoom | null;
  activeRoomId: string | null;
  isOpen: boolean;
  error: string | null;
  isLoading: boolean;
  currentUserId: string | null;
  unreadMessagesCount: number;
  privateChatConnection: null | { roomId: string; userId: string };
  roomsConnection: null | string;
}
