import type { ApiResponse, AuthData } from '~/server/types/auth';
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';
export const useAuth = () => {
  const authStore = useAuthStore();
  const userStore = useUserStore();

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
      const response = await $fetch<ApiResponse<AuthData>>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (response.data) {
        const { user, token } = response.data;
        userStore.setUser(user);
        authStore.setToken(token);
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
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
    register,
    login,
    logout,
    isAuthenticated: computed(() => authStore.isAuthenticated),
    user: computed(() => userStore.user),
  };
};
