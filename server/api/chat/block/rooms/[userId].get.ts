// server/api/chat/block/rooms/[userId].get.ts
import { blockedService } from '~/server/services/chat/blocked.service';

export default defineEventHandler(async (event) => {
  const userId = event.context.params?.userId;

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  try {
    const response = await blockedService.getBlockedRooms(userId);
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to get blocked rooms',
    });
  }
});
