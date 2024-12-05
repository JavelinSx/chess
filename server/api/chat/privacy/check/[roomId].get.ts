// server/api/chat/privacy/[roomId].get.ts
import { privacyService } from '~/server/services/chat/privacy.service';

export default defineEventHandler(async (event) => {
  const roomId = event.context.params?.roomId;

  if (!roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room ID is required',
    });
  }

  try {
    const response = await privacyService.checkRoomPrivacy(roomId);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to check privacy settings',
    });
  }
});
