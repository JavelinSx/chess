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
      currentInvitation: null as { fromInviteId: string; fromInviteName: string } | null,
      filterOptions: {
        onlineOnly: false,
        sortCriteria: 'rating' as 'rating' | 'isGame' | 'gamesPlayed',
        sortDirection: 'desc' as 'asc' | 'desc',
      },
      searchQuery: '',
      currentPage: 1,
      itemsPerPage: 10,
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
    filteredUsersList(state): ClientUser[] {
      let filteredList = state.usersList.filter((user) => user._id !== state.user?._id);

      // Функция для определения, является ли пользователь "свободным"
      const isFree = (user: ClientUser) => user.isOnline && !user.isGame;

      // Применяем фильтр "только онлайн" или "free", в зависимости от критерия сортировки
      if (state.filterOptions.sortCriteria === 'isGame') {
        filteredList = filteredList.filter(isFree);
      } else if (state.filterOptions.onlineOnly) {
        filteredList = filteredList.filter((user) => user.isOnline);
      }

      // Применяем поисковый запрос
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filteredList = filteredList.filter((user) => user.username.toLowerCase().includes(query));
      }

      // Сортировка
      const sortProperty = state.filterOptions.sortCriteria === 'isGame' ? 'rating' : state.filterOptions.sortCriteria;
      filteredList.sort((a, b) => {
        if (state.filterOptions.sortCriteria === 'isGame') {
          // Если сортируем по "free", то свободные пользователи всегда идут первыми
          if (isFree(a) !== isFree(b)) {
            return isFree(a) ? -1 : 1;
          }
        }
        // Для всех остальных случаев сортируем по выбранному критерию
        const aValue = a[sortProperty] as number;
        const bValue = b[sortProperty] as number;
        return state.filterOptions.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });

      return filteredList;
    },
    paginatedUsers(state): ClientUser[] {
      const start = (state.currentPage - 1) * state.itemsPerPage;
      const end = start + state.itemsPerPage;

      const result = this.filteredUsersList.slice(start, end);

      return result;
    },
    totalPages(state): number {
      return Math.ceil(this.filteredUsersList.length / state.itemsPerPage);
    },
    totalUsers(): number {
      return this.filteredUsersList.length;
    },
  },
  actions: {
    setUser(user: ClientUser) {
      this.user = user;
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
    setSearchQuery(query: string) {
      this.searchQuery = query;
    },
    setCurrentPage(page: number) {
      this.currentPage = page;
    },
    setItemsPerPage(count: number) {
      this.itemsPerPage = count;
      this.currentPage = 1;
    },
    updateFilterOptions(options: Partial<typeof this.filterOptions>) {
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
    paths: ['user'], // Сохраняем только данные пользователя
  },
});
