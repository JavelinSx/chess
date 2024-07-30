import { useAuthStore } from '../store/auth';

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  // Список публичных маршрутов
  const publicRoutes = ['/login', '/register'];

  // Проверяем, требует ли маршрут аутентификации
  if (!publicRoutes.includes(to.path) && !authStore.isAuthenticated) {
    // Если пользователь не аутентифицирован и пытается получить доступ к защищенному маршруту
    return navigateTo('/login');
  }

  // Если пользователь аутентифицирован и пытается получить доступ к страницам входа/регистрации
  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    // Перенаправляем на главную страницу
    return navigateTo('/');
  }
});
