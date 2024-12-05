import type { ChatSetting } from '~/server/types/user';

export interface CreateRoomParams {
  userId: string;
  username: string;
  userAvatar: string;
  userChatSetting: ChatSetting;
  recipientId: string;
  recipientUsername: string;
  recipientAvatar: string;
  recipientChatSetting: ChatSetting;
}
