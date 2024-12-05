// store/gameAdditional.ts
import { defineStore } from 'pinia';
import { useGameStore } from './game';
import type { ChessBoard, GameResult, PieceColor } from '~/server/types/game';

export const useGameAdditionalStore = defineStore('gameAdditional', {
  state: () => ({}),

  actions: {
    determineWinner(playerOutOfTime: 'white' | 'black'): 'white' | 'black' | 'draw' {
      const gameStore = useGameStore();
      if (!gameStore.currentGame) return 'draw';

      const materialDifference = this.evaluateMaterialDifference(gameStore.currentGame.board);

      if (Math.abs(materialDifference) < 1) {
        return 'draw';
      }

      if (playerOutOfTime === 'white') {
        return materialDifference > 3 ? 'white' : 'black';
      } else {
        return materialDifference < -3 ? 'black' : 'white';
      }
    },

    evaluateMaterialDifference(board: ChessBoard): number {
      const pieceValues = {
        pawn: 1,
        knight: 3,
        bishop: 3,
        rook: 5,
        queen: 9,
        king: 0,
      };

      let whiteMaterial = 0;
      let blackMaterial = 0;

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece) {
            const value = pieceValues[piece.type];
            if (piece.color === 'white') {
              whiteMaterial += value;
            } else {
              blackMaterial += value;
            }
          }
        }
      }

      return whiteMaterial - blackMaterial;
    },

    resetGame() {
      this.$reset();
    },
  },
  persist: {
    storage: persistedState.localStorage,
  },
});
