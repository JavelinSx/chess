import { githubAuth } from '~/server/services/auth.service';

export default defineEventHandler(async (event) => {
  console.log('GitHub callback received');
  const query = getQuery(event);
  const { code, state } = query;
  const savedState = getCookie(event, 'github_auth_state');

  console.log('Received state:', state);
  console.log('Saved state:', savedState);

  if (!code || !state) {
    throw createError({
      statusCode: 400,
      message: 'Missing required OAuth parameters',
    });
  }

  if (state !== savedState) {
    console.error('State mismatch:', { received: state, saved: savedState });
    throw createError({
      statusCode: 400,
      message: 'Invalid state parameter',
    });
  }

  try {
    // Очищаем state cookie
    deleteCookie(event, 'github_auth_state');

    const response = await githubAuth(event, code.toString());
    console.log('GitHub auth response:', response);

    return response;
  } catch (error) {
    console.error('GitHub callback error:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to authenticate with GitHub',
    });
  }
});
