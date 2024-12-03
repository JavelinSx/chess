import type { ChatMessage } from './message.types';

export interface PaginatedMessages {
  messages: ChatMessage[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  isBlocked: boolean;
}
