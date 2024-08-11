import { defineStore } from 'pinia';
import { useCookie } from '#app';
import type { IUser } from '~/server/types/user';
import { authApi } from '~/shared/api/api';
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as IUser | null,
    token: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    async register(email: string, password: string) {
      const { data, error } = await authApi.register(email, password);
      if (error) throw new Error(error);
      if (data) {
        this.setUser(data.user);
        this.setToken(data.token);
      }
    },

    async login(email: string, password: string) {
      const { data, error } = await authApi.login(email, password);
      if (error) throw new Error(error);
      if (data) {
        this.setUser(data.user);
        this.setToken(data.token);
      }
    },

    async logout() {
      const { error } = await authApi.logout();
      if (error) throw new Error(error);
      this.setUser(null);
      this.setToken(null);
    },

    setUser(user: IUser | null) {
      this.user = user;
    },

    setToken(token: string | null) {
      this.token = token;
    },
  },
});
