import { UserService } from '~/server/services/user.service';

export default defineEventHandler(async (event) => {
  const { userId, isOnline, isGame } = await readBody(event);
  if (typeof userId !== 'string' || typeof isOnline !== 'boolean' || typeof isGame !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input types',
    });
  }
  await UserService.updateUserStatus(userId, isOnline, isGame);
  return { success: true };
});
