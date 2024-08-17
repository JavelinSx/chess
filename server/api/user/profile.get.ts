import User from '~/server/db/models/user.model';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const userId = query.id as string;

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }
    return { data: user.toObject(), error: null };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    });
  }
});
