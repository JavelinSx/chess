import { defineStore } from 'pinia';
import { useUserStore } from '~/store/user';
import type { ClientUser } from '~/server/types/user';

export const usePaginationStore = defineStore('pagination', {
  state: () => ({
    currentPage: 1,
    itemsPerPage: 10,
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

      const sortProperty = this.filterOptions.sortCriteria === 'isGame' ? 'rating' : this.filterOptions.sortCriteria;
      filteredList.sort((a, b) => {
        if (this.filterOptions.sortCriteria === 'isGame') {
          if (isFree(a) !== isFree(b)) {
            return isFree(a) ? -1 : 1;
          }
        }
        const aValue = a[sortProperty] as number;
        const bValue = b[sortProperty] as number;
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
