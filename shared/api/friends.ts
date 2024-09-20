import type { ApiResponse } from '~/server/types/auth';
import type { Friend, FriendRequestClient, FriendsData } from '~/server/types/friends';
import { apiRequest } from './api';

export const friendsApi = {
  async getFriends(): Promise<ApiResponse<FriendsData>> {
    console.log('friendsApi.getFriends called');
    try {
      const response = await apiRequest<FriendsData>('/friends', 'GET');
      console.log('friendsApi.getFriends response:', response);
      return response;
    } catch (error) {
      console.error('Error in friendsApi.getFriends:', error);
      throw error;
    }
  },

  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<ApiResponse<FriendRequestClient>> {
    return apiRequest<FriendRequestClient>('/friends/requests', 'POST', { fromUserId, toUserId });
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
