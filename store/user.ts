import { defineStore } from 'pinia';
import type { ClientUser } from '~/server/types/user';
import { userApi } from '~/shared/api/user';
import { gameApi } from '~/shared/api/game';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as ClientUser | null,
    usersList: [] as ClientUser[],
    currentInvitation: null as { fromInviteId: string; fromInviteName: string } | null,
    filterOptions: {
      onlineOnly: false,
      sortCriteria: 'rating' as 'rating' | 'isGame' | 'gamesPlayed',
      sortDirection: 'desc' as 'asc' | 'desc',
    },
  }),
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
    filteredUsersList: (state): ClientUser[] => {
      console.log('Starting filteredUsersList getter');
      console.log('Current filter options:', state.filterOptions);

      // Исключаем текущего пользователя из списка
      let filteredList = state.usersList.filter((user) => user._id !== state.user?._id);

      const isFree = (user: ClientUser) => user.isOnline && !user.isGame;

      if (state.filterOptions.sortCriteria === 'isGame') {
        // Для фильтрации Free оставляем только онлайн пользователей, которые не в игре
        filteredList = filteredList.filter((user) => isFree(user));
      } else if (state.filterOptions.onlineOnly) {
        filteredList = filteredList.filter((user) => user.isOnline);
      }

      const sortByRating = (a: ClientUser, b: ClientUser) =>
        state.filterOptions.sortDirection === 'asc' ? a.rating - b.rating : b.rating - a.rating;

      let result: ClientUser[];

      if (state.filterOptions.sortCriteria === 'isGame') {
        // Для Free пользователей сортируем только по рейтингу
        result = [...filteredList].sort(sortByRating);
      } else if (state.filterOptions.sortCriteria === 'rating') {
        result = [...filteredList].sort(sortByRating);
      } else if (state.filterOptions.sortCriteria === 'gamesPlayed') {
        result = [...filteredList].sort((a, b) => {
          return state.filterOptions.sortDirection === 'asc'
            ? a.gamesPlayed - b.gamesPlayed
            : b.gamesPlayed - a.gamesPlayed;
        });
      } else {
        result = filteredList;
      }

      console.log(
        'Sorted list:',
        result.map(
          (user) =>
            `${user.username} (isOnline: ${user.isOnline}, isGame: ${user.isGame}, isFree: ${isFree(user)}, rating: ${
              user.rating
            })`
        )
      );
      return result;
    },
  },
  actions: {
    setUser(user: ClientUser) {
      this.user = user;
    },
    clearUser() {
      this.user = null;
    },
    setUsersList(users: ClientUser[]) {
      console.log('Setting usersList:', users);
      this.usersList = users;
    },
    updateFilterOptions(options: Partial<typeof this.filterOptions>) {
      console.log('Updating filter options:', options);
      this.filterOptions = { ...this.filterOptions, ...options };
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
    async sendGameInvitation(toInviteId: string) {
      const response = await userApi.sendGameInvitation(toInviteId);
      if (response.error) {
        console.error('Failed to send game invitation:', response.error);
      } else if (response.data && response.data.success) {
        console.log('Game invitation sent successfully');
      }
    },
    async acceptGameInvitation() {
      if (!this.currentInvitation) {
        console.error('No current invitation to accept');
        return;
      }
      try {
        const response = await gameApi.acceptInvitation(this.currentInvitation.fromInviteId);
        if (response.data && response.data.gameId) {
          this.currentInvitation = null;
        } else if (response.error) {
          console.error('Failed to accept game invitation:', response.error);
        } else {
          console.error('Unexpected response structure:', response);
        }
      } catch (error) {
        console.error('Error accepting game invitation:', error);
      }
    },
    rejectGameInvitation() {
      this.currentInvitation = null;
    },
    handleGameInvitation(fromInviteId: string, fromInviteName: string) {
      this.currentInvitation = { fromInviteId, fromInviteName };
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
  },
});
