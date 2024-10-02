// server/api/user/delete-account.ts
import { defineEventHandler } from 'h3';
import { UserService } from '~/server/services/user.service';

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const result = await UserService.deleteAccount(userId);
    if (result.error) {
      throw createError({
        statusCode: 400,
        statusMessage: result.error,
      });
    }
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error deleting account:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete account',
    });
  }
});
