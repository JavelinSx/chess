import type { ApiResponse } from '~/server/types/api';
import type { UserProfileResponse, ClientUser, ChatSetting, UserStats } from '~/server/types/user';
import { apiRequest } from './api';

export const userApi = {
  async profileUpdate(
    id: string,
    username: string,
    email: string,
    chatSetting: ChatSetting
  ): Promise<ApiResponse<UserProfileResponse>> {
    return apiRequest<UserProfileResponse>('/user/profile-update', 'POST', { id, username, email, chatSetting });
  },

  async profileGet(id: string): Promise<ApiResponse<ClientUser>> {
    return apiRequest<ClientUser>(`/user/profile?id=${id}`, 'GET');
  },

  async getUsersList(): Promise<ApiResponse<ClientUser[]>> {
    return apiRequest<ClientUser[]>('/users/list', 'GET');
  },

  async updateUser(user: ClientUser): Promise<ApiResponse<ClientUser>> {
    const userRecord: Record<string, unknown> = {
      _id: user._id,
      username: user.username,
      email: user.email,
      rating: user.rating,
      title: user.title,
      stats: user.stats,
      lastLogin: user.lastLogin,
      isOnline: user.isOnline,
      isGame: user.isGame,
      winRate: user.winRate,
      friends: user.friends,
      currentGameId: user.currentGameId,
      chatSetting: user.chatSetting,
    };
    return apiRequest<ClientUser>('/user/update', 'POST', userRecord);
  },

  async updateUserStatus(
    userId: string,
    isOnline: boolean,
    isGame: boolean
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>('/user/update-status', 'POST', { userId, isOnline, isGame });
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest<{ success: boolean; message: string }>('/user/change-password', 'POST', {
      currentPassword,
      newPassword,
    });
  },

  async updateUserStats(userId: string, stats: Partial<UserStats>): Promise<ApiResponse<UserStats>> {
    return apiRequest<UserStats>('/user/update-stats', 'POST', { userId, stats });
  },

  async resetUserStats(userId: string): Promise<ApiResponse<UserStats>> {
    return apiRequest<UserStats>('/user/reset-stats', 'POST', { userId });
  },
};
