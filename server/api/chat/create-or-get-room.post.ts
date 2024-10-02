// ~/server/api/chat/create-or-get-room.post.ts

import { ChatService } from '~/server/services/chat.service';
import type { ApiResponse } from '~/server/types/api';
import type { IChatRoom } from '~/server/types/chat';
import { z } from 'zod';

const CreateOrGetRoomParamsSchema = z.object({
  senderUserId: z.string(),
  recipientUserId: z.string(),
  chatSettingSender: z.enum(['all', 'friends_only', 'nobody']),
  chatSettingRecipient: z.enum(['all', 'friends_only', 'nobody']),
});

export default defineEventHandler(
  async (event): Promise<ApiResponse<{ room: IChatRoom | null; canInteract: boolean }>> => {
    const body = await readBody(event);

    const result = CreateOrGetRoomParamsSchema.safeParse(body);

    if (!result.success) {
      console.log('Invalid data:', result.error.issues); // Добавьте это для отладки
      return {
        data: null,
        error: 'Invalid or missing required parameters',
      };
    }

    const { senderUserId, recipientUserId, chatSettingSender, chatSettingRecipient } = result.data;

    try {
      const response = await ChatService.createOrGetRoomWithPrivacyCheck(
        senderUserId,
        recipientUserId,
        chatSettingSender,
        chatSettingRecipient
      );

      return response;
    } catch (error) {
      console.error('Error creating or getting room:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }
);
