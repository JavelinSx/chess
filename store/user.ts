import { defineStore } from 'pinia';
import type { IUser } from '~/server/types/user';
import { userApi } from '~/shared/api/user';
import { gameApi } from '~/shared/api/game';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as IUser | null,
    usersList: [] as IUser[],
    currentInvitation: null as { fromInviteId: string; fromInviteName: string } | null,
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
  },
  actions: {
    setUser(user: IUser) {
      this.user = user;
    },
    clearUser() {
      this.user = null;
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
          this.usersList = response.data;
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
          const router = useRouter();
          router.push(`/game/${response.data.gameId}`);
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
      // Здесь можно добавить логику для отклонения приглашения, если это необходимо
      this.currentInvitation = null;
    },
    handleGameInvitation(fromInviteId: string, fromInviteName: string) {
      console.log(`Received game invitation from ${fromInviteName}`);
      this.currentInvitation = { fromInviteId, fromInviteName };
    },

    async handleGameStart(gameId: string) {
      console.log(`Game ${gameId} started`);
      const router = useRouter();
      router.push(`/game/${gameId}`);
    },
  },
  persist: {
    storage: persistedState.localStorage,
    paths: ['user'],
  },
});
