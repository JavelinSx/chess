import type { AuthData } from '~/server/types/auth';
import type { ApiResponse } from '~/server/types/api';
import { apiRequest } from './api';

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
};
