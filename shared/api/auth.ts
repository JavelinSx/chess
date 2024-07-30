import type { AuthResponse, ApiResponse } from '~/server/types/auth';
import { apiRequest } from './api';

export const authApi = {
  async register(username: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return apiRequest<AuthResponse>('/auth/register', 'POST', { username, email, password });
  },

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return apiRequest<AuthResponse>('/auth/login', 'POST', { email, password });
  },
};
