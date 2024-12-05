import { isDraw } from '~/shared/game-state';
import type { GameResult, GameResultReason } from '~/server/types/game';
import type { GameStore } from '~/stores/game';

export function useGameEnd(gameStore: GameStore) {
  async function handleGameEnd(reason: GameResultReason) {
    if (!gameStore.currentGame) return;

    const currentGame = gameStore.currentGame;
    const currentTurn = currentGame.currentTurn;
    const whitePlayer = currentGame.players.white;
    const blackPlayer = currentGame.players.black;

    const result: GameResult = {
      winner: {
        _id: whitePlayer!._id,
        username: whitePlayer!.username,
        avatar: whitePlayer!.avatar || '',
      },
      loser: {
        _id: blackPlayer!._id,
        username: blackPlayer!.username,
        avatar: blackPlayer!.avatar || '',
      },
      reason,
    };

    if (reason === 'checkmate' || reason === 'forfeit' || reason === 'timeout') {
      const currentPlayer = currentGame.players[currentTurn];
      const otherPlayer = currentGame.players[currentTurn === 'white' ? 'black' : 'white'];

      result.winner = {
        _id: otherPlayer!._id,
        username: otherPlayer!.username,
        avatar: otherPlayer!.avatar || '',
      };
      result.loser = {
        _id: currentPlayer!._id,
        username: currentPlayer!.username,
        avatar: currentPlayer!.avatar || '',
      };
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
