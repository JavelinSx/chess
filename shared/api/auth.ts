import type { AuthData } from '~/server/types/auth';
import type { ApiResponse } from '~/server/types/api';
import { apiRequest } from './api';
import type { ClientUser, IUser } from '~/server/types/user';

export const authApi = {
  async register(username: string, email: string, password: string): Promise<ApiResponse<AuthData>> {
    return apiRequest<AuthData>('/auth/register', 'POST', { username, email, password });
  },

  async login(email: string, password: string): Promise<ApiResponse<AuthData>> {
    return apiRequest<AuthData>('/auth/login', 'POST', { email, password });
  },

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>('/auth/logout', 'POST');
  },

  async loginWithGithub(code: string): Promise<ApiResponse<AuthData>> {
    return apiRequest<AuthData>('/auth/github', 'POST', { code });
  },

  async checkAuth(): Promise<ApiResponse<AuthData>> {
    return apiRequest<{ isAuthenticated: boolean; user: IUser }>('/auth/check', 'GET');
  },
};
