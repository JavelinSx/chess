// server/api/auth/google/init.post.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    const state = Math.random().toString(36).substring(7);

    // Устанавливаем cookie с state
    setCookie(event, 'google_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 минут
      path: '/',
    });

    const params = new URLSearchParams({
      client_id: config.public.googleClientId,
      redirect_uri: config.public.googleRedirectUri,
      response_type: 'code',
      scope: 'email profile',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return {
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      state, // Возвращаем state для отладки
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to initialize Google auth',
    });
  }
});
