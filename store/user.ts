import { defineStore } from 'pinia';
import type { ClientUser } from '~/server/types/user';
import { userApi } from '~/shared/api/user';
import { gameApi } from '~/shared/api/game';

export const useUserStore = defineStore('user', {
  state: () => {
    console.log('Initializing user store');
    return {
      user: null as ClientUser | null,
      usersList: [] as ClientUser[],
    };
  },
  getters: {
    _id: (state) => state.user?._id,
    username: (state) => state.user?.username,
    email: (state) => state.user?.email,
    rating: (state) => state.user?.rating,
    gamesPlayed: (state) => state.user?.gamesPlayed,
    gamesWon: (state) => state.user?.gamesWon,
    gamesLost: (state) => state.user?.gamesLost,
    gamesDraw: (state) => state.user?.gamesDraw,
    lastLogin: (state) => state.user?.lastLogin,
    isOnline: (state) => state.user?.isOnline,
    isGame: (state) => state.user?.isGame,
    winRate: (state) => state.user?.winRate,
    currentGameId: (state) => state.user?.currentGameId,
  },
  actions: {
    setUser(user: ClientUser) {
      this.user = user;
    },
    async changePassword(currentPassword: string, newPassword: string) {
      try {
        const response = await userApi.changePassword(currentPassword, newPassword);
        if (response.data) {
          // Предполагаем, что сервер возвращает { message: string } в случае успеха
          return { success: true, message: response.data.message };
        } else if (response.error) {
          throw new Error(response.error);
        } else {
          throw new Error('Unexpected response structure');
        }
      } catch (error) {
        console.error('Error changing password:', error);
        throw error;
      }
    },
    async getUser(id: string) {
      try {
        const response = await userApi.profileGet(id);
        if (response.data) {
          this.user = response.data;
          return response.data;
        } else if (response.error) {
          console.error('Error fetching user:', response.error);
          return null;
        }
      } catch (error) {
        console.error('Error in getUser:', error);
        return null;
      }
    },
    clearUser() {
      this.user = null;
    },
    setUsersList(users: ClientUser[]) {
      this.usersList = users;
    },
    async updateProfile(username: string, email: string) {
      if (!this.user) {
        throw new Error('User is not authenticated');
      }
      const response = await userApi.profileUpdate(this.user._id, username, email);
      if (response.data) {
        this.setUser({ ...this.user, username, email });
      } else if (response.error) {
        throw new Error(response.error);
      }
    },
    async fetchUsersList() {
      try {
        const response = await userApi.getUsersList();
        if (response.data) {
          this.usersList = response.data.map((user) => ({
            ...user,
            isOnline: !!user.isOnline,
            isGame: !!user.isGame,
          }));
        } else if (response.error) {
          console.error('Failed to fetch users list:', response.error);
        }
      } catch (error) {
        console.error('Error fetching users list:', error);
      }
    },
    async updateUserStatus(isOnline: boolean, isGame: boolean) {
      if (this.user) {
        await userApi.updateUserStatus(this.user._id, isOnline, isGame);
        this.user.isOnline = isOnline;
        this.user.isGame = isGame;
      }
    },
    updateUserInList(userId: string, isOnline: boolean, isGame: boolean) {
      const userIndex = this.usersList.findIndex((u) => u._id === userId);
      if (userIndex !== -1) {
        this.usersList[userIndex] = {
          ...this.usersList[userIndex],
          isOnline,
          isGame,
        };
      }
    },
    async handleGameStart(gameId: string) {
      navigateTo(`/game/${gameId}`);
    },
    updateUserStats(stats: Partial<ClientUser>) {
      if (this.user) {
        this.user = { ...this.user, ...stats };
      }
    },
    updateAllUsers(users: ClientUser[]) {
      this.usersList = users;
    },
  },
  persist: {
    storage: persistedState.localStorage,
    paths: ['user'], // Сохраняем только данные пользователя
  },
});
