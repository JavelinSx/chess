import { useUserStore } from '~/store/user';
import { useAuthStore } from '../store/auth';
import type { LoginResponse } from '~/server/types/auth.js';
export const useAuth = () => {
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const router = useRouter();

  const register = async (username: string, email: string, password: string) => {
    try {
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: { username, email, password },
      });
      console.log('hello');
      // После успешной регистрации, перенаправляем на страницу входа
      router.push('/login');
    } catch (error) {
      // Обработка ошибки регистрации
      console.error('Registration error:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { user, token } = await $fetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      userStore.setUser(user);
      authStore.setToken(token);
      // После успешного входа, перенаправляем на главную страницу
      router.push('/');
    } catch (error) {
      // Обработка ошибки входа
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' });
      authStore.logout();
      // После выхода, перенаправляем на страницу входа
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    register,
    login,
    logout,
    isAuthenticated: computed(() => authStore.isAuthenticated),
    user: computed(() => userStore.user),
  };
};
