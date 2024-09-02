import { defineEventHandler } from 'h3';
import { friendsService } from '~/server/services/friends.service';

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;

  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  try {
    const requests = await friendsService.getFriendRequests(userId);
    return {
      data: {
        received: requests.filter((req) => req.to.toString() === userId),
        sent: requests.filter((req) => req.from.toString() === userId),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch friend requests',
    });
  }
});
