import { defineStore } from 'pinia';
import type { IUser } from '~/types/user/types';
import { userApi } from './api/userApi';
import type { ApiResponse } from './api/apiRequest';
import type { IUpdateProfileData } from '~/types/user/types';
import { useCookie } from 'nuxt/app';
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as IUser | null,
    isAuthenticated: false,
    lastChecked: 0, // Timestamp последней проверки
    error: null as string | null,
    gamesPlayed: null,
    gamesWon: null,
    gamesLost: null,
    isEditing: false,
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

    async updateProfile(profileData: IUpdateProfileData) {
      try {
        const response = await userApi.updateProfile(profileData);
        if (response.data) {
          this.user = response.data;
        }
      } catch (error) {
        console.error('Failed to update profile:', error);
        throw error;
      }
    },

    async checkAuth() {
      const now = Date.now();
      if (now - this.lastChecked < 5 * 60 * 1000) {
        return;
      }

      try {
        const response = await userApi.getProfile();
        if (response.data) {
          this.user = response.data;
          this.isAuthenticated = true;
          this.lastChecked = now;
          if (import.meta.client) {
            localStorage.setItem(
              'authState',
              JSON.stringify({
                isAuthenticated: true,
                lastChecked: now,
              })
            );
          }
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        this.user = null;
        this.isAuthenticated = false;
        if (process.client) {
          localStorage.removeItem('authState');
        }
        if (error instanceof Error) {
          this.error = error.message;
        } else {
          this.error = 'An unknown error occurred';
        }
        throw error;
      }
    },
    setEditingMode(value: boolean) {
      this.isEditing = value;
    },
    initAuth() {
      if (import.meta.client) {
        const authState = localStorage.getItem('authState');
        if (authState) {
          const { isAuthenticated, lastChecked } = JSON.parse(authState);
          this.isAuthenticated = isAuthenticated;
          this.lastChecked = lastChecked;
        }
      }
    },
    logout() {
      this.user = null;
      this.isAuthenticated = false;
      this.error = null;
      const tokenCookie = useCookie('token');
      tokenCookie.value = null;
      if (import.meta.client) {
        localStorage.removeItem('authState');
      }
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
        console.log('Execute user action response:', response);
        if (response.error) {
          throw new Error(response.error);
        }
        if (response.data) {
          this.user = response.data;
          this.isAuthenticated = true;

          // Сохраняем токен в куки
          const tokenCookie = useCookie('token', {
            maxAge: 60 * 60 * 24 * 7, // 7 дней
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
          tokenCookie.value = response.data.token || ''; // Предполагаем, что токен приходит в data.token
          console.log('Token set in cookie:', tokenCookie.value);

          // Сохраняем состояние аутентификации в localStorage
          localStorage.setItem(
            'authState',
            JSON.stringify({
              isAuthenticated: true,
              lastChecked: Date.now(),
            })
          );
        }
      } catch (error) {
        console.error(`${errorMessage}:`, error);
        if (error instanceof Error) {
          this.error = error.message;
        } else {
          this.error = 'An unknown error occurred';
        }
        throw error;
      }
    },
  },

  getters: {
    userRating: (state) => state.user?.rating ?? 0,
    isUserOnline: (state) => state.user?.isOnline ?? false,
    hasToken: () => {
      if (import.meta.client) {
        const tokenCookie = useCookie('token');
        return !!tokenCookie.value;
      }
      return false;
    },
  },
});
