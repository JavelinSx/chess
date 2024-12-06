export interface ChatMessage {
  _id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: number;
  isRead: boolean;
}
