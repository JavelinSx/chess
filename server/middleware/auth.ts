// server/middleware/auth.ts

import { defineEventHandler, parseCookies, createError } from 'h3';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const cookies = parseCookies(event);
  const token = cookies.auth_token;

  // Список публичных маршрутов
  const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

  if (!token) {
    // Если нет токена и маршрут не публичный, перенаправляем на страницу входа
    if (!publicRoutes.includes(event.path)) {
      if (event.path.startsWith('/api/')) {
        throw createError({
          statusCode: 401,
          message: 'Unauthorized',
        });
      } else {
        return sendRedirect(event, '/login');
      }
    }
    return; // Для публичных маршрутов просто продолжаем выполнение
  }

  try {
    const jwtSecret = config.jwtSecret! || process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, jwtSecret);
    // Добавляем информацию о пользователе в контекст события
    event.context.auth = decoded;
    // Если пользователь аутентифицирован и пытается получить доступ к страницам входа/регистрации
    if (event.path === '/login' || event.path === '/register') {
      return sendRedirect(event, '/');
    }
  } catch (error) {
    // Токен недействителен
    deleteCookie(event, 'auth_token');
    if (event.path.startsWith('/api/') && !publicRoutes.includes(event.path)) {
      // Для API запросов (кроме публичных) возвращаем ошибку
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      });
    } else if (!publicRoutes.includes(event.path)) {
      // Для непубличных маршрутов перенаправляем на страницу входа
      return sendRedirect(event, '/login');
    }
    // Для публичных маршрутов просто очищаем контекст аутентификации
    event.context.auth = null;
  }
});
