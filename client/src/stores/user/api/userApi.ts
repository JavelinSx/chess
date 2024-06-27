import type { IUser } from '~/types/user/types';
import { apiRequest } from './apiRequest';
import type { ApiResponse } from './apiRequest';
export const userApi = {
  async register(username: string, email: string, password: string): Promise<ApiResponse<IUser>> {
    return apiRequest<IUser>('/api/users/register', 'POST', { username, email, password });
  },

  async login(email: string, password: string): Promise<ApiResponse<IUser>> {
    return apiRequest<IUser>('/api/users/login', 'POST', { email, password });
  },

  async getProfile(): Promise<ApiResponse<IUser>> {
    return apiRequest<IUser>('/api/users/profile');
  },

  async updateProfile(profileData: { username: string; email: string }): Promise<ApiResponse<IUser>> {
    return apiRequest<IUser>('/api/users/profile', 'PUT', profileData);
  },
};
