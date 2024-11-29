import { isDraw } from '~/shared/game-state';
import type { GameResult, GameResultReason } from '~/server/types/game';
import type { GameStore } from '~/store/game';

export function useGameEnd(gameStore: GameStore) {
  async function handleGameEnd(reason: GameResultReason) {
    if (!gameStore.currentGame) return;
    const result: GameResult = {
      winner: null,
      loser: null,
      reason,
    };

    if (reason === 'checkmate' || reason === 'forfeit' || reason === 'timeout') {
      const currentTurn = gameStore.currentGame.currentTurn;
      result.loser = gameStore.currentGame.players[currentTurn]!._id;
      result.winner = gameStore.currentGame.players[currentTurn === 'white' ? 'black' : 'white']!._id;
    }

    await gameStore.handleGameEnd(result);
  }

  function checkGameEnd() {
    const currentGame = gameStore.currentGame;
    if (!currentGame || currentGame.status === 'completed') return;

    if (currentGame.isCheckmate) {
      handleGameEnd('checkmate');
    } else if (currentGame.isStalemate) {
      handleGameEnd('stalemate');
    } else if (isDraw(currentGame)) {
      handleGameEnd('draw');
    }
  }

  return {
    handleGameEnd,
    checkGameEnd,
  };
}
