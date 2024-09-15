import { defineEventHandler, readBody } from 'h3';
import { updateUserProfile } from '~/server/services/user.service';

export default defineEventHandler(async (event) => {
  const { id, username, email, chatSetting } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  try {
    const updatedUser = await updateUserProfile(id, { username, email, chatSetting });
    return { data: updatedUser, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
});
