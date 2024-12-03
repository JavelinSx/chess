// services/chat/index.ts

import { roomService } from './room.service';
import { messageService } from './message.service';
import { privacyService } from './privacy.service';
import { cleanupService } from './cleanup.service';

import type { IChatRoom, ChatMessage } from '~/server/types/chat';
import type { ChatSetting } from '~/server/types/user';
import type { ApiResponse } from '~/server/types/api';

// Собираем все методы сервисов в один объект с четким указанием что и откуда берется
export const ChatService = {
  // Room methods
  createOrGetRoomWithPrivacyCheck: roomService.createOrGetRoom,
  getRoomsWithPrivacyCheck: roomService.getRooms,
  getRoomByParticipants: roomService.getByParticipants,
  deleteRoom: roomService.delete,

  // Message methods
  addMessage: messageService.add,
  getRoomMessages: messageService.getMessages,

  // Privacy methods
  updateUserChatPrivacy: privacyService.updatePrivacy,
  canInteract: privacyService.canInteract,

  // Cleanup methods
  handleDeletedUser: cleanupService.handleUserDeletion,
} as const;

// Для удобства использования можем добавить тип самого сервиса
export type ChatServiceType = typeof ChatService;
