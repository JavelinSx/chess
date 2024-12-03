import type { ChatRoom } from './room.types';

export interface RoomWithPrivacy extends ChatRoom {
  canSendMessage: boolean;
  isBlocked: boolean;
}
