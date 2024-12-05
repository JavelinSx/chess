// server/api/chat/privacy/update.post.ts
import { privacyService } from '~/server/services/chat/privacy.service';

export default defineEventHandler(async (event) => {
  const { userId, chatSetting } = await readBody(event);

  if (!userId || !chatSetting) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID and chat setting are required',
    });
  }

  try {
    const response = await privacyService.updatePrivacy(userId, chatSetting);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to update privacy settings',
    });
  }
});
