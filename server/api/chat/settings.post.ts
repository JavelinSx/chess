// server/api/chat/settings.post.ts
import { chatService } from '~/server/services/chat.service';
import type { UserChatSettings } from '~/server/types/chat';

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;
  const settings = await readBody<UserChatSettings>(event);

  if (!userId || !settings) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    });
  }

  chatService.setUserChatSettings(userId, settings);

  return { success: true };
});
