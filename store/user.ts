import { defineStore } from 'pinia';
import type { ClientUser, ChatSetting, UserStats } from '~/server/types/user';
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

    setUsersList(users: ClientUser[]) {
      this.usersList = users;
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

    async getUser(id: string) {
      try {
        const response = await userApi.profileGet(id);
        if (response.data) {
          this.user = response.data;
          return response.data;
        } else if (response.error) {
          console.error('Error fetching user:', response.error);
        }
        return null;
      } catch (error) {
        console.error('Error in getUser:', error);
        return null;
      }
    },

    async updateUser(updatedUser: ClientUser) {
      console.log(updatedUser, 'updatedUser');
      try {
        const response = await userApi.updateUser(updatedUser);
        if (response.data) {
          this.updateUserInList(updatedUser);
          if (this.user && this.user._id === updatedUser._id) {
            this.user = updatedUser;
          }
        } else if (response.error) {
          console.error('Failed to update user:', response.error);
        }
      } catch (error) {
        console.error('Error updating user:', error);
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

    async deleteAccount() {
      try {
        const authStore = useAuthStore();
        const response = await userApi.deleteAccount();
        if (response.data && response.data.success) {
          this.clearUser();
          authStore.logout();
          navigateTo('/login');
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
      }
    },

    handleUserDeleted(deletedUserId: string) {
      if (this.user && this.user._id === deletedUserId) {
        this.clearUser();
        navigateTo('/login');
      }

      // Обновляем список пользователей
      this.usersList = this.usersList.map((user) =>
        user._id === deletedUserId ? { ...user, username: 'Deleted User', isDeleted: true } : user
      );

      // Обновляем список друзей
      if (this.user) {
        this.user.friends = this.user.friends.filter((friend) => friend._id !== deletedUserId);
      }
    },

    async fetchUsersList() {
      try {
        if (this.usersList.length === 0) {
          const response = await userApi.getUsersList();
          if (response.data && Array.isArray(response.data)) {
            this.usersList = response.data;
          } else if (response.error) {
            console.error('Failed to fetch users list:', response.error);
          }
        }
      } catch (error) {
        console.error('Error fetching users list:', error);
      }
    },

    updateUserInList(updatedUser: ClientUser) {
      const index = this.usersList.findIndex((user) => user._id === updatedUser._id);
      if (index !== -1) {
        this.usersList[index] = updatedUser;
      }
    },

    updateUserStatus(userId: string, isOnline: boolean, isGame: boolean) {
      const user = this.usersList.find((u) => u._id === userId);
      if (user) {
        user.isOnline = isOnline;
        user.isGame = isGame;
      }
    },

    async updateCurrentUserStatus(isOnline: boolean, isGame: boolean) {
      if (this.user) {
        await userApi.updateUserStatus(this.user._id, isOnline, isGame);
        this.user.isOnline = isOnline;
        this.user.isGame = isGame;
      }
    },

    async updateUserStats(stats: Partial<UserStats>) {
      if (!this.user) return;
      try {
        const response = await userApi.updateUserStats(this.user._id, stats);
        if (response.data) {
          this.user = { ...this.user, stats: { ...this.user.stats, ...stats } };
          this.updateUserInList(this.user);
        } else if (response.error) {
          console.error('Failed to update user stats:', response.error);
        }
      } catch (error) {
        console.error('Error updating user stats:', error);
      }
    },

    async resetUserStats() {
      if (!this.user) return;
      try {
        const response = await userApi.resetUserStats(this.user._id);
        if (response.data) {
          this.user = { ...this.user, stats: response.data };
          this.updateUserInList(this.user);
        } else if (response.error) {
          console.error('Failed to reset user stats:', response.error);
        }
      } catch (error) {
        console.error('Error resetting user stats:', error);
      }
    },

    updateAllUsers(users: ClientUser[]) {
      if (Array.isArray(users)) {
        this.usersList = users;
        if (this.user) {
          const updatedCurrentUser = users.find((u) => u._id === this.user?._id);
          if (updatedCurrentUser) {
            this.user = updatedCurrentUser;
          }
        }
      } else {
        console.error('Invalid users data:', users);
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
