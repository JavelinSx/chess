import { defineStore } from 'pinia';
import { useCookie } from '#app';
import type { AuthData } from '~/server/types/auth';
import type { ApiResponse } from '~/server/types/api';
import { authApi } from '~/shared/api/auth';
import { useUserStore } from './user';
import { useChatStore } from './chat';
import { useFriendsStore } from './friends';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    error: null as string | null,
  }),

  getters: {
    isAuthenticated(): boolean {
      const authCookie = useCookie('auth_token');
      return !!authCookie.value;
    },
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
      localStorage.clear();
      userStore.user = null;
      const authCookie = useCookie('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('userList');
      authCookie.value = null;
      await navigateTo('/login');
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

    setToken(token: string | null) {
      const authCookie = useCookie('auth_token', {
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      authCookie.value = token;
    },
  },
});
