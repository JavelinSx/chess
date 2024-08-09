import { defineStore } from 'pinia';
import { useCookie } from '#app';
import type { AuthData, ApiResponse } from '~/server/types/auth';
import { authApi } from '~/shared/api/auth';
import { useUserStore } from './user';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    error: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(email: string, password: string) {
      const response = await authApi.login(email, password);
      this.setAuthData(response);
    },
    async register(username: string, email: string, password: string) {
      const response = await authApi.register(username, email, password);
      this.setAuthData(response);
    },
    async logout() {
      const userStore = useUserStore();
      if (userStore.user) {
        await userStore.updateUserStatus(false, false);
      }
      // Очистка данных аутентификации
      userStore.user = null;
      this.token = null;
      const authCookie = useCookie('auth_token');
      authCookie.value = null;
      localStorage.clear();
    },
    setToken(token: string | null) {
      this.token = token;
      const authCookie = useCookie('auth_token', {
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      authCookie.value = token;
    },
    setAuthData(response: ApiResponse<AuthData>) {
      if (response.data) {
        const userStore = useUserStore();
        userStore.setUser(response.data.user);
        this.setToken(response.data.token);
      } else if (response.error) {
        this.error = response.error;
      }
    },
  },
  persist: {
    storage: persistedState.localStorage,
  },
});
