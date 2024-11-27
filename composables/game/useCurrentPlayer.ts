import { computed } from 'vue';
import type { GameStore } from '~/store/game';
import type { UserStore } from '~/store/user';

export function useCurrentPlayer(gameStore: GameStore, userStore: UserStore) {
  const currentPlayerId = computed(() => {
    const game = gameStore.currentGame;
    if (!game) return null;

    return game.currentTurn === 'white' ? game.players.white?._id : game.players.black?._id;
  });

  const currentPlayerName = computed(() => {
    if (currentPlayerId.value === userStore.user?._id) {
      return userStore.user?.username || 'Your';
    }

    const opponent = userStore.usersList.find((user) => user._id === currentPlayerId.value);
    return opponent ? opponent.username : "Opponent's";
  });

  const currentPlayerAvatar = computed(() => userStore.user?.avatar);

  return {
    currentPlayerId,
    currentPlayerName,
    currentPlayerAvatar,
  };
}
