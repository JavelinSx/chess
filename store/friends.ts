import { defineStore } from 'pinia';
import type { Friend, FriendRequestClient } from '~/server/types/friends';
import { friendsApi } from '~/shared/api/friends';

interface FriendsState {
  friends: Friend[];
  receivedRequests: FriendRequestClient[];
  sentRequests: FriendRequestClient[];
  friendRequests: FriendRequestClient[];
  isLoading: boolean;
  error: string | null;
}

interface ChatState extends FriendsState {
  locales: ReturnType<typeof useI18n>;
}

export const useFriendsStore = defineStore('friends', {
  state: (): ChatState => ({
    friends: [],
    friendRequests: [] as FriendRequestClient[],
    receivedRequests: [],
    sentRequests: [],
    isLoading: false,
    error: null,
    locales: useI18n(),
  }),

  actions: {
    async fetchFriends() {
      this.isLoading = true;
      try {
        const response = await friendsApi.getFriends();
        if (response.data) {
          const { friends, friendRequests } = response.data;
          this.friends = friends;
          this.friendRequests = friendRequests;
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = this.locales.t('failedToFetchFriends');
      } finally {
        this.isLoading = false;
      }
    },

    async sendFriendRequest(toUserId: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await friendsApi.sendFriendRequest(toUserId);
        if (response.data) {
          this.sentRequests.push(response.data);
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Friend request already exists') {
          this.error = this.locales.t('friendRequestAlreadyExists');
        } else {
          this.error = this.locales.t('failedToSendFriendRequest');
        }
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

    // Методы для обработки SSE событий
    handleFriendRequest(request: FriendRequestClient) {
      if (!this.receivedRequests.some((req) => req._id === request._id)) {
        this.receivedRequests.push(request);
      }
    },

    handleFriendRequestsUpdate(updatedRequests: FriendRequestClient[]) {
      this.friendRequests = updatedRequests;
    },

    handleFriendRequestUpdate(updatedRequest: FriendRequestClient) {
      const updateRequest = (list: FriendRequestClient[]) => {
        if (!Array.isArray(list)) {
          return;
        }
        const index = list.findIndex((req) => req._id === updatedRequest._id);
        if (index !== -1) {
          if (updatedRequest.status === 'accepted' || updatedRequest.status === 'rejected') {
            list.splice(index, 1);
          } else {
            list[index] = updatedRequest;
          }
        }
      };

      if (!this.receivedRequests) this.receivedRequests = [];
      if (!this.sentRequests) this.sentRequests = [];
      if (!this.friendRequests) this.friendRequests = [];

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

    async initializeFriendData() {
      await this.fetchFriends();
    },
  },
});
