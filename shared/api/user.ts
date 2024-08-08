import type { ApiResponse } from '~/server/types/auth';
import type { UserProfileResponse } from '~/server/types/user';
import type { ClientUser } from '~/server/types/user';
import { apiRequest } from './api';

export const userApi = {
  async profileUpdate(id: string, username: string, email: string): Promise<ApiResponse<UserProfileResponse>> {
    return apiRequest<UserProfileResponse>('/users/update-profile', 'POST', { id, username, email });
  },

  async getUsersList(): Promise<ApiResponse<ClientUser[]>> {
    return apiRequest<ClientUser[]>('/users/list', 'GET');
  },

  async updateUserStatus(
    userId: string,
    isOnline: boolean,
    isGame: boolean
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>('/users/update-status', 'POST', { userId, isOnline, isGame });
  },

  async sendGameInvitation(toInviteId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>('/game/invite', 'POST', { toInviteId });
  },
};
