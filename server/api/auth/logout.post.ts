import { defineEventHandler } from 'h3';
import { logoutUser } from '~/server/services/auth.service';

export default defineEventHandler(async (event) => {
  const userId = event.context.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }
  return logoutUser(event, userId);
});
