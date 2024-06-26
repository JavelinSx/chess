import { defineStore } from 'pinia';
import { IUser } from '@/types/user/types';
import { userApi } from '@/shared/api/userApi';
import { ApiResponse } from '@/shared/api/apiRequest';
import { useCookie } from 'nuxt/app';
export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null as IUser | null,
    error: null as string | null,
  }),

  actions: {
    async register(username: string, email: string, password: string) {
      await this.executeUserAction(() => userApi.register(username, email, password), 'Registration failed');
    },

    async login(email: string, password: string) {
      await this.executeUserAction(() => userApi.login(email, password), 'Login failed');
    },

    async fetchProfile() {
      await this.executeUserAction(() => userApi.getProfile(), 'Failed to fetch profile');
    },

    logout() {
      this.currentUser = null;
      this.error = null;
      const tokenCookie = useCookie('token');
      tokenCookie.value = null;
    },
    verifyToken(token: string) {
      return !!token;
    },
    clearError() {
      this.error = null;
    },

    // Приватная функция для выполнения действий с пользователем
    async executeUserAction(action: () => Promise<ApiResponse<IUser>>, errorMessage: string) {
      try {
        const response = await action();
        if (response.error) {
          throw new Error(response.error);
        }
        if (response.data) {
          this.currentUser = response.data;
          if (response.token) {
            const tokenCookie = useCookie('token');
            tokenCookie.value = response.token;
          }
        }
      } catch (error) {
        console.error(`${errorMessage}:`, error);
        this.error = error instanceof Error ? error.message : 'An unknown error occurred';
        throw error;
      }
    },
  },

  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    userRating: (state) => state.currentUser?.rating ?? 0,
    isUserOnline: (state) => state.currentUser?.isOnline ?? false,
  },
});
