// middleware/auth.ts
import { useUserStore } from '~/stores/user/userStore';
import { navigateTo } from 'nuxt/app';
import { defineNuxtRouteMiddleware } from 'nuxt/app';

export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore();

  if (!userStore.isAuthenticated) {
    try {
      await userStore.checkAuth();
      // Если checkAuth() прошел успешно, пользователь аутентифицирован
      // Позволяем продолжить навигацию на запрошенную страницу
      return;
    } catch (error) {
      console.error('Authentication failed:', error);
      // Перенаправляем на /auth только если проверка аутентификации не удалась
      return navigateTo('/auth');
    }
  }

  // Если пользователь уже аутентифицирован, позволяем продолжить навигацию
  return;
});
