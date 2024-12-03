import type { ChatSetting } from './room.types';

export interface CreateRoomParams {
  userId: string;
  recipientId: string;
  userChatSetting: ChatSetting;
  recipientChatSetting: ChatSetting;
}

export interface GetMessagesParams {
  roomId: string;
  page: number;
  limit: number;
}
