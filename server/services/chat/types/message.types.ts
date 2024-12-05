// types/chat/messages.types.ts
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export interface MessageStatusInfo {
  status: MessageStatus;
  deliveredAt?: Date;
  readAt?: Date;
}

export interface ChatMessage {
  roomId: string;
  senderId: string;
  username: string;
  content: string;
  timestamp: number;
  status: MessageStatusInfo;
}
