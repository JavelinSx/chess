import { defineEventHandler, parseCookies, createError } from 'h3';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const cookies = parseCookies(event);
  const token = cookies.auth_token;

  if (!token) {
    return; // Не аутентифицирован, но это нормально для публичных страниц
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    // Добавляем информацию о пользователе в контекст события
    event.context.auth = decoded;
  } catch (error) {
    // Токен недействителен
    deleteCookie(event, 'auth_token');
    if (event.path.startsWith('/api/') && event.path !== '/api/auth/login' && event.path !== '/api/auth/register') {
      // Для API запросов (кроме логина и регистрации) возвращаем ошибку
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }
    // Для обычных страниц просто очищаем контекст аутентификации
    event.context.auth = null;
  }
});
