import { defineStore } from 'pinia';

interface userState {
  nickname: string;
  name: string;
  famaly: string;
  statistic: {
    winGame: number;
    loseGame: number;
  };
}

export const useUserStore = defineStore('user', {
  state: (): userState => {},
  actions: {},
});
