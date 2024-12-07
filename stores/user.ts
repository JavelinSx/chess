import { defineStore } from 'pinia';
import type { ClientUser, ChatSetting, UserStats } from '~/server/types/user';
import { userApi } from '~/shared/api/user';
import { useAuthStore } from './auth';

export const useUserStore = defineStore(
  'user',
  () => {
    // Состояние
    const state = reactive({
      user: null as ClientUser | null,
      usersList: [] as ClientUser[],
    });

    // Геттеры
    const _id = computed(() => state.user?._id);
    const username = computed(() => state.user?.username);
    const email = computed(() => state.user?.email);
    const rating = computed(() => state.user?.rating);
    const stats = computed(() => state.user?.stats);
    const lastLogin = computed(() => state.user?.lastLogin);
    const isOnline = computed(() => state.user?.isOnline);
    const isGame = computed(() => state.user?.isGame);
    const winRate = computed(() => state.user?.winRate);
    const currentGameId = computed(() => state.user?.currentGameId);
    const chatSettings = computed(() => state.user?.chatSetting);

    // Действия
    function setUser(user: ClientUser) {
      state.user = user;
    }

    function clearUser() {
      state.user = null;
      state.usersList = [];
    }

    async function getUserById(userId: string): Promise<ClientUser | null> {
      let userInList = state.usersList.find((u) => u._id === userId);
      if (!userInList && state.usersList.length === 0) {
        await getUsersList();
        userInList = state.usersList.find((u) => u._id === userId);
      }
      return userInList || null;
    }

    function updateUserStatus(userId: string, isOnline: boolean, isGame: boolean) {
      const userInList = state.usersList.find((u) => u._id === userId);
      if (userInList) {
        userInList.isOnline = isOnline;
        userInList.isGame = isGame;
      }
      if (state.user && state.user._id === userId) {
        state.user.isOnline = isOnline;
        state.user.isGame = isGame;
      }
    }

    function updateUser(updatedUser: Partial<ClientUser>) {
      const index = state.usersList.findIndex((u) => u._id === updatedUser._id);
      if (index !== -1) {
        state.usersList[index] = { ...state.usersList[index], ...updatedUser };
      }
      if (state.user && state.user._id === updatedUser._id) {
        state.user = { ...state.user, ...updatedUser };
      }
    }

    function updateAllUsers(users: ClientUser[]) {
      state.usersList = users;
      if (state.user) {
        const updatedCurrentUser = users.find((u) => u._id === state.user?._id);
        if (updatedCurrentUser) {
          state.user = updatedCurrentUser;
        }
      }
    }

    function addUser(user: ClientUser) {
      if (!state.usersList.some((u) => u._id === user._id)) {
        state.usersList.push(user);
      }
    }

    function removeUser(userId: string) {
      state.usersList = state.usersList.filter((u) => u._id !== userId);
      if (state.user && state.user._id === userId) {
        state.user = null;
      }
    }

    async function deleteAccount() {
      try {
        const authStore = useAuthStore();
        const response = await userApi.deleteAccount();
        if (response.data?.success) {
          clearUser();
          authStore.logout();
          navigateTo('/login');
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
      }
    }

    async function changePassword(currentPassword: string, newPassword: string) {
      try {
        const response = await userApi.changePassword(currentPassword, newPassword);
        if (response.data) {
          return { success: true, message: response.data.message };
        }
        throw new Error(response.error || 'Unexpected response structure');
      } catch (error) {
        console.error('Error changing password:', error);
        throw error;
      }
    }

    async function updateProfile(username: string, email: string, chatSetting: ChatSetting, avatar: string) {
      if (!state.user) throw new Error('User is not authenticated');
      try {
        const response = await userApi.profileUpdate(state.user._id, username, email, avatar, chatSetting);
        if (response.data) {
          setUser({ ...state.user, username, email, chatSetting, avatar });
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    }

    async function getUsersList() {
      try {
        const response = await userApi.getUsersList();
        if (response.data) {
          state.usersList = response.data;
        }
      } catch (error) {
        console.error('Failed to fetch users list:', error);
      }
    }

    function updateUserStats(updatedStats: UserStats) {
      if (state.user) {
        state.user.stats = updatedStats;
        updateUser({ ...state.user, stats: updatedStats });
      }
      const userInList = state.usersList.find((u) => u._id === state.user?._id);
      if (userInList) {
        userInList.stats = updatedStats;
      }
    }

    function handleUserDeleted(deletedUserId: string) {
      if (state.user && state.user._id === deletedUserId) {
        clearUser();
        navigateTo('/login');
      }
      state.usersList = state.usersList.filter((user) => user._id !== deletedUserId);
      if (state.user) {
        state.user.friends = state.user.friends.filter((friend) => friend._id !== deletedUserId);
      }
    }

    function getUserInUserList(id: string) {
      return state.usersList.find((user) => user._id === id);
    }

    return {
      // Состояние
      ...toRefs(state),

      // Геттеры
      _id,
      username,
      email,
      rating,
      stats,
      lastLogin,
      isOnline,
      isGame,
      winRate,
      currentGameId,
      chatSettings,

      // Методы
      setUser,
      clearUser,
      getUserById,
      updateUserStatus,
      updateUser,
      updateAllUsers,
      addUser,
      removeUser,
      deleteAccount,
      changePassword,
      updateProfile,
      getUsersList,
      updateUserStats,
      handleUserDeleted,
      getUserInUserList,
    };
  },
  {
    persist: true,
  }
);
