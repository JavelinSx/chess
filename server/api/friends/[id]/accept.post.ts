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

    const result = await friendsService.respondToFriendRequest(requestId, userId, accept);

    return {
      data: result,
      error: null,
    };
  } catch (error) {
    console.error(`Error responding to friend request:`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
});
