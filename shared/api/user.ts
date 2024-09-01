import type { ApiResponse } from '~/server/types/auth';
import type { UserProfileResponse } from '~/server/types/user';
import type { ClientUser } from '~/server/types/user';
import { apiRequest } from './api';

export const userApi = {
  async profileUpdate(id: string, username: string, email: string): Promise<ApiResponse<UserProfileResponse>> {
    return apiRequest<UserProfileResponse>('/user/profile-update', 'POST', { id, username, email });
  },

  async profileGet(id: string): Promise<ApiResponse<ClientUser>> {
    return apiRequest<ClientUser>(`/user/profile?id=${id}`, 'GET');
  },

  async getUsersList(): Promise<ApiResponse<ClientUser[]>> {
    return apiRequest<ClientUser[]>('/users/list', 'GET');
  },

  async updateUserStatus(
    userId: string,
    isOnline: boolean,
    isGame: boolean
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>('/user/update-status', 'POST', { userId, isOnline, isGame });
  },
};
