import { comparePassword, hashPassword } from '~/server/utils/auth';
import User from '~/server/db/models/user.model';

export default defineEventHandler(async (event) => {
  const { currentPassword, newPassword } = await readBody(event);
  const userId = event.context.auth?.userId;

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }

    const isPasswordCorrect = await comparePassword(currentPassword, user.password);
    if (!isPasswordCorrect) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password is incorrect',
      });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    user.password = hashedNewPassword;
    await user.save();

    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    console.error('Error changing password:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to change password',
    });
  }
});
