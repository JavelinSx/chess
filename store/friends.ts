import { defineStore } from 'pinia';
import type { Friend, FriendRequestClient } from '~/server/types/friends';
import { friendsApi } from '~/shared/api/friends';
import { useUserStore } from './user';

export const useFriendsStore = defineStore('friends', {
  state: () => ({
    friends: [] as Friend[],
    friendRequests: [] as FriendRequestClient[],
    receivedRequests: [] as FriendRequestClient[],
    sentRequests: [] as FriendRequestClient[],
    isLoading: false as boolean,
    error: null as string | null,
    locales: useI18n(),
  }),

  actions: {
    async fetchFriends() {
      this.isLoading = true;
      try {
        const response = await friendsApi.getFriends();
        if (response.data) {
          this.friends = response.data.friends || [];
          this.updateFriendRequests(response.data.friendsRequests || []);
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = 'Failed to fetch friends';
      } finally {
        this.isLoading = false;
      }
    },

    async sendFriendRequest(toUserId: string) {
      this.isLoading = true;
      this.error = null;
      const userStore = useUserStore();
      const fromUserId = userStore.user?._id;

      if (!fromUserId) {
        this.error = this.locales.t('userNotAuthenticated');
        this.isLoading = false;
        return;
      }

      try {
        const response = await friendsApi.sendFriendRequest(fromUserId, toUserId);
        if (response.data) {
          if (typeof response.data === 'object' && 'message' in response.data) {
            if ('alreadyExists' in response.data && response.data.alreadyExists) {
              this.error = this.locales.t('friendRequestAlreadyExists');
            } else {
              const newRequest = response.data as FriendRequestClient;
              const existingRequest = this.sentRequests.find((req) => req.to === toUserId);
              if (!existingRequest) {
                this.sentRequests.push(newRequest);
              }
            }
          }
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = this.locales.t('failedToSendFriendRequest');
      } finally {
        this.isLoading = false;
      }
    },

    async respondToFriendRequest(requestId: string, accept: boolean) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await friendsApi.respondToFriendRequest(requestId, accept);
        if (response.data) {
          this.receivedRequests = this.receivedRequests.filter((req) => req._id !== requestId);
          if (accept) {
            await this.fetchFriends();
          }
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = this.locales.t(accept ? 'failedToAcceptFriendRequest' : 'failedToRejectFriendRequest');
      } finally {
        this.isLoading = false;
      }
    },

    async removeFriend(friendId: string) {
      this.isLoading = true;
      try {
        const response = await friendsApi.removeFriend(friendId);
        if (response.data && response.data.success) {
          this.friends = this.friends.filter((friend) => friend._id !== friendId);
          await this.fetchFriends();
        } else {
          const errorMessage =
            response.error || (response.data && response.data.message) || this.locales.t('unknownErrorOccurred');
          this.error = errorMessage;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : this.locales.t('failedToRemoveFriend');
      } finally {
        this.isLoading = false;
      }
    },

    // SSE event handlers
    handleFriendRequest(request: FriendRequestClient) {
      const userStore = useUserStore();
      const currentUserId = userStore.user?._id;

      if (request.to === currentUserId && !this.receivedRequests.some((req) => req._id === request._id)) {
        this.receivedRequests.push(request);
      } else if (request.from === currentUserId && !this.sentRequests.some((req) => req._id === request._id)) {
        this.sentRequests.push(request);
      }
    },

    handleFriendRequestsUpdate(updatedRequests: FriendRequestClient[]) {
      this.updateFriendRequests(updatedRequests);
    },

    handleFriendRequestUpdate(updatedRequest: FriendRequestClient) {
      const updateRequest = (list: FriendRequestClient[]) => {
        const index = list.findIndex((req) => req._id === updatedRequest._id);
        if (index !== -1) {
          if (updatedRequest.status === 'accepted' || updatedRequest.status === 'rejected') {
            list.splice(index, 1);
          } else {
            list[index] = updatedRequest;
          }
        }
      };

      updateRequest(this.receivedRequests);
      updateRequest(this.sentRequests);
      updateRequest(this.friendRequests);

      if (updatedRequest.status === 'accepted') {
        this.fetchFriends();
      }
    },

    handleFriendListUpdate(updatedFriends: Friend[]) {
      if (Array.isArray(updatedFriends) && updatedFriends.length > 0) {
        this.friends = updatedFriends;
      }
    },

    updateFriendRequests(requests: FriendRequestClient[]) {
      const userStore = useUserStore();
      const currentUserId = userStore.user?._id;

      this.receivedRequests = requests.filter((req) => req.to === currentUserId);
      this.sentRequests = requests.filter((req) => req.from === currentUserId);
      this.friendRequests = requests;
    },

    async initializeFriendData() {
      await this.fetchFriends();
    },
  },
});
