import type { ChatSetting } from '~/server/types/user';

export interface ChatParticipant {
  userId: string;
  username: string;
  chatSetting: ChatSetting;
  avatar: string;
}
