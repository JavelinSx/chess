import { defineStore } from 'pinia';
import type { AuthData } from '~/server/types/auth';
import type { ApiResponse } from '~/server/types/api';
import type { IUser } from '~/server/types/user';
import { authApi } from '~/shared/api/auth';
import { useUserStore } from './user';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    error: null as string | null,
    isAuthenticated: false,
  }),

  actions: {
    setIsAuthenticated(value: boolean) {
      this.isAuthenticated = value;
    },

    async login(email: string, password: string) {
      try {
        const response = await authApi.login(email, password);
        if (response.data) {
          this.setIsAuthenticated(true);
          const userStore = useUserStore();
          userStore.setUser(response.data.user);
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = 'Failed to login';
      }
    },

    async register(username: string, email: string, password: string) {
      try {
        const response = await authApi.register(username, email, password);
        if (response.data) {
          await this.login(email, password);
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = 'Failed to register';
      }
    },

    async checkAuth() {
      try {
        const response = await authApi.checkAuth();
        this.setIsAuthenticated(response.data?.isAuthenticated!);
        if (response.data && response.data.isAuthenticated && response.data.user) {
          const userStore = useUserStore();
          userStore.setUser(response.data.user);
        }
        return response.data?.isAuthenticated;
      } catch (error) {
        this.setIsAuthenticated(false);
        return false;
      }
    },

    async logout() {
      try {
        await authApi.logout();
        this.setIsAuthenticated(false);
        const userStore = useUserStore();
        userStore.clearUser();
        const authCookie = useCookie('auth_token');
        authCookie.value = null;
        navigateTo('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    },
  },

  persist: {
    storage: persistedState.localStorage,
  },
});
