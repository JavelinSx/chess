import { defineEventHandler, readBody } from 'h3';
import { friendsService } from '~/server/services/friends.service';

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;
  const requestId = event.context.params?.id;

  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  if (!requestId) {
    throw createError({
      statusCode: 400,
      message: 'Request ID is required',
    });
  }

  try {
    const { accept } = await readBody(event);

    if (typeof accept !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: 'Accept parameter must be a boolean',
      });
    }

    const status = accept ? true : false;
    await friendsService.respondToFriendRequest(requestId, userId, status);

    return {
      success: true,
      message: `Friend request ${status}`,
    };
  } catch (error) {
    console.error(`Error friend request:`, error);
    throw createError({
      statusCode: 500,
      message: `Failed to friend request`,
    });
  }
});
