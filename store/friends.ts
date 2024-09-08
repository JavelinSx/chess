import { defineStore } from 'pinia';
import type { Friend, FriendRequestClient, FriendsData } from '~/server/types/friends';
import { friendsApi } from '~/shared/api/friends';

interface FriendsState {
  friends: Friend[];
  receivedRequests: FriendRequestClient[];
  sentRequests: FriendRequestClient[];
  friendRequests: FriendRequestClient[];
  isLoading: boolean;
  error: string | null;
}

export const useFriendsStore = defineStore('friends', {
  state: (): FriendsState => ({
    friends: [],
    friendRequests: [] as FriendRequestClient[],
    receivedRequests: [],
    sentRequests: [],
    isLoading: false,
    error: null,
  }),

  actions: {
    async fetchFriends() {
      console.log('Fetching friends...');
      this.isLoading = true;
      try {
        const response = await friendsApi.getFriends();
        console.log(response.data);
        if (response.data) {
          const { friends, friendRequests } = response.data;
          console.log('friendRequests', friendRequests);
          this.friends = friends;
          this.friendRequests = friendRequests;
          console.log('Friends list updated:', this.friends);
        } else if (response.error) {
          console.error('Error fetching friends:', response.error);
          this.error = response.error;
        }
      } catch (error) {
        console.error('Failed to fetch friends:', error);
        this.error = 'Failed to fetch friends';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchFriendRequests() {
      this.isLoading = true;
      try {
        const response = await friendsApi.getFriendRequests();
        if (response.data) {
          this.receivedRequests = response.data.received;
          this.sentRequests = response.data.sent;
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = 'Failed to fetch friend requests';
      } finally {
        this.isLoading = false;
      }
    },

    async sendFriendRequest(toUserId: string) {
      this.isLoading = true;
      try {
        const response = await friendsApi.sendFriendRequest(toUserId);
        if (response.data) {
          this.sentRequests.push(response.data);
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = 'Failed to send friend request';
      } finally {
        this.isLoading = false;
      }
    },

    async respondToFriendRequest(requestId: string, accept: boolean) {
      this.isLoading = true;
      try {
        const response = await friendsApi.respondToFriendRequest(requestId, accept);
        if (response.data) {
          // Удаляем запрос из списка полученных запросов
          this.receivedRequests = this.receivedRequests.filter((req) => req._id !== requestId);
          // Очищаем списки после обработки запроса
          if (accept) {
            // Если запрос принят, обновляем список друзей
            await this.fetchFriends();
          }
          // Очищаем все списки запросов
          this.sentRequests = [];
          this.friendRequests = [];
        } else if (response.error) {
          this.error = response.error;
        }
      } catch (error) {
        this.error = `Failed to ${accept ? 'accept' : 'reject'} friend request`;
      } finally {
        this.isLoading = false;
      }
    },

    async removeFriend(friendId: string) {
      this.isLoading = true;
      try {
        const response = await friendsApi.removeFriend(friendId);
        console.log('Remove friend response:', response); // Добавим для отладки

        if (response.data && response.data.success) {
          console.log('Friend removed successfully, updating friends list');
          // Немедленно удаляем друга из локального списка
          this.friends = this.friends.filter((friend) => friend._id !== friendId);
          // Запрашиваем обновленный список друзей с сервера
          await this.fetchFriends();
        } else {
          const errorMessage = response.error || (response.data && response.data.message) || 'Unknown error occurred';
          console.error('Error removing friend:', errorMessage);
          this.error = errorMessage;
        }
      } catch (error) {
        console.error('Failed to remove friend:', error);
        this.error = error instanceof Error ? error.message : 'Failed to remove friend';
      } finally {
        this.isLoading = false;
      }
    },

    // Методы для обработки SSE событий
    handleFriendRequest(request: FriendRequestClient) {
      // Проверяем, нет ли уже такого запроса
      if (!this.receivedRequests.some((req) => req._id === request._id)) {
        this.receivedRequests.push(request);
      }
    },

    handleFriendRequestsUpdate(updatedRequests: FriendRequestClient[]) {
      console.log('Updating friend requests in store:', updatedRequests);
      this.friendRequests = updatedRequests;
    },

    handleFriendRequestUpdate(updatedRequest: FriendRequestClient) {
      console.log('Handling friend request update:', updatedRequest);

      const updateRequest = (list: FriendRequestClient[]) => {
        if (!Array.isArray(list)) {
          console.error('Expected an array, but received:', list);
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

      // Убедимся, что все списки инициализированы
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
      console.log('Updating friends list in store:', updatedFriends);
      if (Array.isArray(updatedFriends) && updatedFriends.length > 0) {
        this.friends = updatedFriends;
      } else {
        console.warn('Attempted to update with empty or invalid friends list');
      }
    },

    // Метод для инициализации данных
    async initializeFriendData() {
      await Promise.all([this.fetchFriends(), this.fetchFriendRequests()]);
    },
  },
});
