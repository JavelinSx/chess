// server/api/auth/google/callback.ts
import { googleAuth } from '~/server/services/google.service';
// server/api/auth/google/callback.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { code } = query; // Убираем проверку state из query
  const savedState = getCookie(event, 'google_auth_state');

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Authorization code is required',
    });
  }

  try {
    // Очищаем state cookie в любом случае
    deleteCookie(event, 'google_auth_state');

    const response = await googleAuth(event, code.toString());

    if (response.error) {
      throw createError({
        statusCode: 400,
        message: response.error,
      });
    }

    return response;
  } catch (error) {
    console.error('Google auth callback error:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
});
