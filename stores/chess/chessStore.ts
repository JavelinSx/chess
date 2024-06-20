import { defineStore } from 'pinia';
import { ISquare, IPiece } from '@/types';
import { initializeBoard } from '@/stores/chess/initializeBoard';

interface ChessState {
  board: ISquare[][];
  currentTurn: boolean;
  selectedPiece: IPiece | null;
  droppedPiece: ISquare | null;
  blackPiecesReset: IPiece[];
  whitePiecesReset: IPiece[];
  mouseMove: {
    x: number;
    y: number;
  };
}

export const useChessStore = defineStore('chess', {
  state: (): ChessState => ({
    board: [],
    currentTurn: false,
    selectedPiece: null,
    droppedPiece: null,
    blackPiecesReset: [] as IPiece[],
    whitePiecesReset: [] as IPiece[],
    mouseMove: {
      x: 0,
      y: 0,
    },
  }),
  actions: {
    initializeBoard() {
      this.board = initializeBoard();
    },
    selectPiece(square: ISquare) {
      if (square.state.type) {
        this.selectedPiece = square.state;
      }
    },
    dropPiece(square: ISquare) {
      if (!this.selectedPiece) {
        return;
      } // добавлена проверка на null
      const selectPiece = this.selectedPiece;
      if (square.state.type !== null) {
        this.capturePiece(square);
      }

      this.movePiece(selectPiece, square);
      this.currentTurn = !this.currentTurn;
      this.resetSelection();
    },
    resetSelection() {
      this.selectedPiece = null;
      this.droppedPiece = null;
    },
    capturePiece(dropPiece: ISquare) {
      if (dropPiece.state.type) {
        if (dropPiece.state.color === 'white') {
          this.whitePiecesReset.push(dropPiece.state);
        } else {
          this.blackPiecesReset.push(dropPiece.state);
        }
      }
    },
    movePiece(selectPiece: IPiece, dropPiece: ISquare) {
      const oldPosition = { ...selectPiece.position };

      selectPiece.position = dropPiece.state.position;
      dropPiece.state = selectPiece;

      const oldSquare = this.board[oldPosition.y][oldPosition.x];
      oldSquare.state = { type: null, color: null, position: oldPosition };
    },
  },
});
