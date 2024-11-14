import { githubAuth } from '~/server/services/auth.service';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { code, state } = query;
  const savedState = getCookie(event, 'github_auth_state');

  if (!code || !state) {
    throw createError({
      statusCode: 400,
      message: 'Missing required OAuth parameters',
    });
  }

  if (state !== savedState) {
    throw createError({
      statusCode: 400,
      message: 'Invalid state parameter',
    });
  }

  try {
    // Очищаем state cookie
    deleteCookie(event, 'github_auth_state');

    const response = await githubAuth(event, code.toString());

    return response;
  } catch (error) {
    console.error('GitHub callback error:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to authenticate with GitHub',
    });
  }
});
