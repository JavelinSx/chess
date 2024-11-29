import { computed } from 'vue';
import type { GameStore } from '~/store/game';

export function useCurrentPlayer(gameStore: GameStore) {
  const whitePlayer = computed(() => gameStore.currentGame?.players.white);
  const blackPlayer = computed(() => gameStore.currentGame?.players.black);

  const currentPlayerName = computed(() => {
    if (gameStore.currentGame?.currentTurn === 'white') {
      return whitePlayer.value?.username;
    } else {
      return blackPlayer.value?.username;
    }
  });

  const currentPlayerAvatar = computed(() => {
    if (gameStore.currentGame?.currentTurn === 'white') {
      return whitePlayer.value?.avatar;
    } else {
      return blackPlayer.value?.avatar;
    }
  });

  return {
    currentPlayerName,
    currentPlayerAvatar,
  };
}
