import { IUser } from '@/types/user/types';
import { apiRequest, ApiResponse } from '@/shared/api/apiRequest';

export const userApi = {
  async register(username: string, email: string, password: string): Promise<ApiResponse<IUser>> {
    return apiRequest<IUser>('/api/users/register', 'POST', { username, email, password });
  },

  async login(email: string, password: string): Promise<ApiResponse<IUser>> {
    return apiRequest<IUser>('/api/users/login', 'POST', { email, password });
  },

  async getProfile(): Promise<ApiResponse<IUser>> {
    return apiRequest<IUser>('/api/user/profile');
  },
};
