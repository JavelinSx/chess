import { computed, onMounted } from 'vue';
import type { AuthData } from '~/server/types/auth';
import type { ApiResponse } from '~/server/types/api';
import { useAuthStore } from '~/store/auth';
import { useGameStore } from '~/store/game';
import { useUserStore } from '~/store/user';
import type { ClientUser } from '~/server/types/user';

export const useAuth = () => {
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const gameStore = useGameStore();
  const authChecked = ref(false);

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await $fetch<ApiResponse<AuthData>>('/api/auth/register', {
        method: 'POST',
        body: { username, email, password },
      });

      if (response.data) {
        navigateTo('/login');
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (response.data && response.data.user) {
        authStore.setIsAuthenticated(true);

        // Преобразуем полученные данные пользователя в тип ClientUser
        const clientUser: ClientUser = {
          ...response.data.user,
          lastLogin: new Date(response.data.user.lastLogin), // Преобразуем строку в объект Date
          // Добавьте здесь другие преобразования, если они необходимы
        };

        userStore.setUser(clientUser);
        navigateTo('/');
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await $fetch<ApiResponse<{ message: string }>>('/api/auth/logout', {
        method: 'POST',
      });

      if (response.data) {
        authStore.logout();
        userStore.clearUser();
        gameStore.clearGameState();
        navigateTo('/login');
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
    }
  };

  return {
    login,
    register,
    logout,
    isAuthenticated: computed(() => authStore.isAuthenticated),
    user: computed(() => userStore.user),
  };
};
