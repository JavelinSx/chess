// middleware/auth.ts
import { useUserStore } from '@/stores/user/userStore';
import { useCookie, navigateTo } from 'nuxt/app';
import { defineNuxtRouteMiddleware } from 'nuxt/app';

export default defineNuxtRouteMiddleware((to, from) => {
  const userStore = useUserStore();
  const token = useCookie('token');

  if (!token.value) {
    return navigateTo('/login');
  }

  try {
    // Здесь нужно добавить логику проверки JWT
    // Например, проверка срока действия токена или его валидности
    // Если токен недействителен, выбросить ошибку
    if (!userStore.verifyToken(token.value)) {
      throw new Error('Invalid token');
    }
  } catch (error) {
    userStore.logout();
    return navigateTo('/login');
  }
});
