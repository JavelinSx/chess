import { defineStore } from 'pinia';
import { useCookie } from '#app';
import type { IUser } from '~/server/types/user';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as IUser | null,
    token: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    async login(email: string, password: string) {
      const response = await $fetch<{ user: IUser; token: string }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      this.setUser(response.user);
      const authCookie = useCookie('auth_token');
      authCookie.value = response.token;
    },
    async register(username: string, email: string, password: string) {
      const response = await $fetch<{ user: IUser; token: string }>('/api/auth/register', {
        method: 'POST',
        body: { username, email, password },
      });
      this.setUser(response.user);
      const authCookie = useCookie('auth_token');
      authCookie.value = response.token;
    },
    logout() {
      this.user = null;
      const authCookie = useCookie('auth_token');
      authCookie.value = null;
    },
    setUser(user: IUser) {
      this.user = user;
    },
    setToken(token: string) {
      this.token = token;
    },
  },
});
