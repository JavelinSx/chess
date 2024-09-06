import { defineEventHandler, readBody } from 'h3';
import { friendsService } from '~/server/services/friends.service';

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;

  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const { toUserId } = await readBody(event);

  if (!toUserId) {
    throw createError({
      statusCode: 400,
      message: 'toUserId is required',
    });
  }

  try {
    const request = await friendsService.sendFriendRequest(userId, toUserId);
    return { success: true, data: request };
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to send friend request',
    });
  }
});
