import type { ChatSetting } from './room.types';

export interface ChatParticipant {
  userId: string;
  username: string;
  chatSetting: ChatSetting;
  avatar: string;
}
