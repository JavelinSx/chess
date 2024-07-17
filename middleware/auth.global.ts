import { useAuthStore } from '../store/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  // Проверяем, требует ли маршрут аутентификации
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Если пользователь не аутентифицирован, перенаправляем на страницу входа
    return navigateTo('/login');
  }

  // Если пользователь аутентифицирован и пытается получить доступ к страницам входа/регистрации
  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    // Перенаправляем на главную страницу
    return navigateTo('/');
  }
});
