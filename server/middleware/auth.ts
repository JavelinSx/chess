import { defineEventHandler, parseCookies, createError } from 'h3';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const cookies = parseCookies(event);
  const token = cookies.auth_token;

  // Список публичных маршрутов
  const publicRoutes = [
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/vk',
    '/api/auth/check',
    '/api/auth/github',
    '/auth/github/callback',
    '/auth/vk/callback',
    '/api/auth/google/callback',
    '/api/auth/google/init',
    '/api/auth/google',
    '/auth/google/callback',
  ];

  const isPublicRoute = publicRoutes.some((route) => event.path.startsWith(route));
  const isApiRoute = event.path.startsWith('/api/');

  if (!token && !isPublicRoute) {
    if (isApiRoute) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      });
    } else {
      return sendRedirect(event, '/login');
    }
  }

  if (token) {
    try {
      const jwtSecret = config.jwtSecret;
      if (!jwtSecret) {
        throw new Error('JWT secret is not defined');
      }
      const decoded = jwt.verify(token, jwtSecret);
      event.context.auth = decoded;

      // Перенаправление аутентифицированных пользователей со страниц входа/регистрации
      if (event.path === '/login' || event.path === '/register') {
        return sendRedirect(event, '/');
      }
    } catch (error) {
      // Токен недействителен
      deleteCookie(event, 'auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      if (isApiRoute && !isPublicRoute) {
        throw createError({
          statusCode: 401,
          message: 'Unauthorized',
        });
      } else if (!isPublicRoute) {
        return sendRedirect(event, '/login');
      }
      event.context.auth = null;
    }
  }
});
