import type { AuthData, ApiResponse } from '~/server/types/auth';
import { apiRequest } from './api';

export const authApi = {
  async register(username: string, email: string, password: string): Promise<ApiResponse<AuthData>> {
    return apiRequest<AuthData>('/auth/register', 'POST', { username, email, password });
  },

  async login(email: string, password: string): Promise<ApiResponse<AuthData>> {
    return apiRequest<AuthData>('/auth/login', 'POST', { email, password });
  },
};
