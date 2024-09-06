import type { ApiResponse } from '~/server/types/auth';
import type { Friend, FriendRequestClient, FriendsData } from '~/server/types/friends';
import { apiRequest } from './api';

export const friendsApi = {
  async getFriends(): Promise<ApiResponse<FriendsData>> {
    return apiRequest<FriendsData>('/friends', 'GET');
  },

  async sendFriendRequest(toUserId: string): Promise<ApiResponse<FriendRequestClient>> {
    return apiRequest<FriendRequestClient>('/friends/requests', 'POST', { toUserId });
  },

  async respondToFriendRequest(requestId: string, accept: boolean): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/friends/${requestId}/accept`, 'POST', { accept });
  },

  async removeFriend(friendId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest<{ success: boolean; message: string }>(`/friends/${friendId}/remove`, 'POST');
  },

  async getFriendRequests(): Promise<ApiResponse<{ received: FriendRequestClient[]; sent: FriendRequestClient[] }>> {
    return apiRequest<{ received: FriendRequestClient[]; sent: FriendRequestClient[] }>('/friends/requests', 'GET');
  },
};
