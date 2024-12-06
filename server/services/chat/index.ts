import { messageService } from './message.service';
import { roomService } from './room.service';

export const ChatService = {
  // Message methods
  sendMessage: messageService.sendMessage,
  getMessages: messageService.getMessages,

  // Room methods
  createRoom: roomService.createOrGetRoom,
  getRooms: roomService.getRooms,
  deleteRoom: roomService.deleteRoom,
} as const;

export type ChatServiceType = typeof ChatService;
