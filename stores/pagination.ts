import { defineStore } from 'pinia';
import { useUserStore } from '~/stores/user';
import type { ClientUser } from '~/server/types/user';

export const usePaginationStore = defineStore('pagination', {
  state: () => ({
    currentPage: 1,
    itemsPerPage: 9,
    searchQuery: '',
    filterOptions: {
      onlineOnly: false,
      sortCriteria: 'rating' as 'rating' | 'isGame' | 'gamesPlayed',
      sortDirection: 'desc' as 'asc' | 'desc',
    },
  }),

  getters: {
    filteredUsersList(): ClientUser[] {
      const userStore = useUserStore();
      if (!Array.isArray(userStore.usersList)) {
        console.error('usersList is not an array:', userStore.usersList);
        return [];
      }

      let filteredList = userStore.usersList.filter((user) => user._id !== userStore.user?._id);

      const isFree = (user: ClientUser) => user.isOnline && !user.isGame;

      if (this.filterOptions.sortCriteria === 'isGame') {
        filteredList = filteredList.filter(isFree);
      } else if (this.filterOptions.onlineOnly) {
        filteredList = filteredList.filter((user) => user.isOnline);
      }

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filteredList = filteredList.filter((user) => user.username.toLowerCase().includes(query));
      }

      filteredList.sort((a, b) => {
        if (this.filterOptions.sortCriteria === 'isGame') {
          if (isFree(a) !== isFree(b)) {
            return isFree(a) ? -1 : 1;
          }
          return b.rating - a.rating; // Если оба свободны или оба заняты, сортируем по рейтингу
        }

        // Получаем значения для сортировки
        let aValue: number, bValue: number;

        if (this.filterOptions.sortCriteria === 'gamesPlayed') {
          aValue = a.stats.gamesPlayed;
          bValue = b.stats.gamesPlayed;
        } else {
          aValue = a.rating;
          bValue = b.rating;
        }

        return this.filterOptions.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });

      return filteredList;
    },

    paginatedUsers(): ClientUser[] {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredUsersList.slice(start, end);
    },

    totalPages(): number {
      return Math.ceil(this.filteredUsersList.length / this.itemsPerPage);
    },

    totalUsers(): number {
      return this.filteredUsersList.length;
    },
  },

  actions: {
    setCurrentPage(page: number) {
      this.currentPage = page;
    },
    setItemsPerPage(count: number) {
      this.itemsPerPage = count;
      this.currentPage = 1;
    },
    setSearchQuery(query: string) {
      this.searchQuery = query;
      this.currentPage = 1;
    },
    updateFilterOptions(options: Partial<typeof this.filterOptions>) {
      this.filterOptions = { ...this.filterOptions, ...options };
      this.currentPage = 1;
    },
  },
});
