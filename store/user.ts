import { defineStore } from 'pinia';
import type { ClientUser, ChatSetting, UserStats } from '~/server/types/user';
import type { GameResult } from '~/server/types/game';
import { userApi } from '~/shared/api/user';
import { useAuthStore } from './auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as ClientUser | null,
    usersList: [] as ClientUser[],
  }),

  getters: {
    _id: (state) => state.user?._id,
    username: (state) => state.user?.username,
    email: (state) => state.user?.email,
    rating: (state) => state.user?.rating,
    stats: (state) => state.user?.stats,
    lastLogin: (state) => state.user?.lastLogin,
    isOnline: (state) => state.user?.isOnline,
    isGame: (state) => state.user?.isGame,
    winRate: (state) => state.user?.winRate,
    currentGameId: (state) => state.user?.currentGameId,
    chatSettings: (state) => state.user?.chatSetting,
  },

  actions: {
    setUser(user: ClientUser) {
      this.user = user;
    },

    clearUser() {
      this.user = null;
      this.usersList = [];
    },

    updateUserStatus(userId: string, isOnline: boolean, isGame: boolean) {
      const userInList = this.usersList.find((u) => u._id === userId);
      if (userInList) {
        userInList.isOnline = isOnline;
        userInList.isGame = isGame;
      }
      if (this.user && this.user._id === userId) {
        this.user.isOnline = isOnline;
        this.user.isGame = isGame;
      }
    },

    updateUser(updatedUser: Partial<ClientUser>) {
      const index = this.usersList.findIndex((u) => u._id === updatedUser._id);
      if (index !== -1) {
        this.usersList[index] = { ...this.usersList[index], ...updatedUser };
      }
      if (this.user && this.user._id === updatedUser._id) {
        this.user = { ...this.user, ...updatedUser };
      }
    },

    updateAllUsers(users: ClientUser[]) {
      this.usersList = users;
      if (this.user) {
        const updatedCurrentUser = users.find((u) => u._id === this.user?._id);
        if (updatedCurrentUser) {
          this.user = updatedCurrentUser;
        }
      }
    },

    addUser(user: ClientUser) {
      if (!this.usersList.some((u) => u._id === user._id)) {
        this.usersList.push(user);
      }
    },

    removeUser(userId: string) {
      this.usersList = this.usersList.filter((u) => u._id !== userId);
      if (this.user && this.user._id === userId) {
        this.user = null;
      }
    },

    async changePassword(currentPassword: string, newPassword: string) {
      try {
        const response = await userApi.changePassword(currentPassword, newPassword);
        if (response.data) {
          return { success: true, message: response.data.message };
        } else if (response.error) {
          throw new Error(response.error);
        }
        throw new Error('Unexpected response structure');
      } catch (error) {
        console.error('Error changing password:', error);
        throw error;
      }
    },

    async updateProfile(username: string, email: string, chatSetting: ChatSetting) {
      if (!this.user) throw new Error('User is not authenticated');
      try {
        const response = await userApi.profileUpdate(this.user._id, username, email, chatSetting);
        if (response.data) {
          this.setUser({ ...this.user, username, email, chatSetting });
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    },

    updateUserStats(updatedStats: UserStats) {
      if (this.user) {
        this.user.stats = updatedStats;
        this.updateUser({ ...this.user, stats: updatedStats });
      }
      // Обновляем пользователя в списке
      const userInList = this.usersList.find((u) => u._id === this.user?._id);
      if (userInList) {
        userInList.stats = updatedStats;
      }
    },

    handleUserDeleted(deletedUserId: string) {
      if (this.user && this.user._id === deletedUserId) {
        this.clearUser();
        navigateTo('/login');
      }

      // Обновляем список пользователей
      this.usersList = this.usersList.filter((user) => user._id !== deletedUserId);

      // Обновляем список друзей текущего пользователя
      if (this.user) {
        this.user.friends = this.user.friends.filter((friend) => friend._id !== deletedUserId);
      }
    },

    getUserInUserList(id: string) {
      return this.usersList.find((user) => user._id === id);
    },
  },

  persist: {
    storage: persistedState.localStorage,
    paths: ['user', 'userList'],
  },
});
