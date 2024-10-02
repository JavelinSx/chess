import { defineEventHandler } from 'h3';
import { friendsService } from '~/server/services/friends.service';

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;
  const friendId = event.context.params?.id;

  if (!userId) {
    return { data: null, error: 'Unauthorized' };
  }

  if (!friendId) {
    return { data: null, error: 'Friend ID is required' };
  }

  try {
    const result = await friendsService.removeFriend(userId, friendId);
    return result;
  } catch (error) {
    console.error('Error removing friend:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to remove friend',
    };
  }
});
