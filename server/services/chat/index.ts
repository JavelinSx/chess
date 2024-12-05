import { messageService } from './message.service';
import { roomService } from './room.service';
import { privacyService } from './privacy.service';
import { blockedService } from './blocked.service';

export const ChatService = {
  // Message methods
  sendMessage: messageService.sendMessage,
  getMessages: messageService.getMessages,
  updateMessageStatus: messageService.updateStatus,
  deleteMessage: messageService.deleteMessage,

  // Room methods
  createRoom: roomService.createOrGetRoom,
  getRooms: roomService.getRooms,
  deleteRoom: roomService.deleteRoom,
  updateParticipant: roomService.updateParticipant,
  getParticipants: roomService.getParticipants,

  // Privacy methods
  updatePrivacy: privacyService.updatePrivacy,
  checkCanInteract: privacyService.canInteract,
  checkRoomPrivacy: privacyService.checkRoomPrivacy,
  getBlockedUsers: privacyService.getBlockedUsers,
  applyRestriction: privacyService.applyRestriction,

  // Block methods
  blockUser: blockedService.blockUser,
  unblockUser: blockedService.unblockUser,
  getBlockInfo: blockedService.getBlockInfo,
  updateBlockDuration: blockedService.updateBlockDuration,
  cleanExpiredBlocks: blockedService.cleanExpiredBlocks,
  getBlockedRooms: blockedService.getBlockedRooms,
} as const;

export type ChatServiceType = typeof ChatService;
