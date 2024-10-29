export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    // Генерируем state
    const state = Math.random().toString(36).substring(7);

    // Создаем URL для авторизации
    const params = new URLSearchParams({
      client_id: config.public.githubClientId,
      redirect_uri: config.public.githubRedirectUri,
      scope: 'user:email',
      state: state,
      response_type: 'code',
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    // Сохраняем state в cookie вместо localStorage
    setCookie(event, 'github_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes
    });

    return { authUrl };
  } catch (error) {
    console.error('Error creating GitHub auth URL:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to create GitHub auth URL',
    });
  }
});
