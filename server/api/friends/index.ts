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
    const [friends, friendsRequests] = await Promise.all([
      friendsService.getFriends(userId),
      friendsService.getFriendRequests(userId),
    ]);
    const response = {
      friends: friends.data,
      friendsRequests: friendsRequests.data,
    };
    return {
      data: response,
      erron: null,
    };
  } catch (error) {
    console.error('Error fetching friends:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch friends',
    });
  }
});
