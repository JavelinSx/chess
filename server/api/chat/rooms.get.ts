// ~/server/api/chat/rooms.get.ts

import { ChatService } from '~/server/services/chat.service';
import type { IChatRoom } from '~/server/types/chat';
import type { ChatSetting } from '~/server/types/user';
import type { ApiResponse } from '~/server/types/api';
import { z } from 'zod';

const RoomRequestParamsSchema = z.object({
  userId: z.string(),
  chatSetting: z.string(),
});

export default defineEventHandler(async (event): Promise<ApiResponse<IChatRoom[]>> => {
  const query = getQuery(event);

  const result = RoomRequestParamsSchema.safeParse(query);

  if (!result.success) {
    return {
      data: null,
      error: 'Invalid or missing required parameters',
    };
  }

  const { userId, chatSetting } = result.data;

  try {
    const response = await ChatService.getRoomsWithPrivacyCheck(userId, chatSetting as ChatSetting);
    return response;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unknown error occurred in fetching rooms',
    };
  }
});
