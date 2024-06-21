// stores/chess/chessStore.ts
import { defineStore } from 'pinia';
import { ISquare, IPiece, IPosition } from '@/types';
import { initializeBoard } from '@/stores/chess/initializeBoard';
import { getPossibleMoves } from '@/shared/helpers/getPossibleMoves';
import { validLogicMove } from '@/shared/helpers/moveLogic';
import { canCastle, executeCastling } from '@/shared/helpers/castlingLogic';

interface ChessState {
  board: ISquare[][];
  selectedPiece: IPiece | null;
  droppedPiece: ISquare | null;
  blackPiecesReset: IPiece[];
  whitePiecesReset: IPiece[];
  mouseMove: {
    x: number;
    y: number;
  };
  possibleMove: IPosition[];
  whoMoveNow: 'black' | 'white';
  stateMoveKing: boolean;
  stateMoveTower: boolean;
  stateCheck: boolean;
  stateCheckMate: boolean;
}

export const useChessStore = defineStore('chess', {
  state: (): ChessState => ({
    board: initializeBoard(),
    selectedPiece: null,
    droppedPiece: null,
    blackPiecesReset: [] as IPiece[],
    whitePiecesReset: [] as IPiece[],
    mouseMove: {
      x: 0,
      y: 0,
    },
    possibleMove: [],
    whoMoveNow: 'white',
    stateMoveKing: false,
    stateMoveTower: false,
    stateCheck: false,
    stateCheckMate: false,
  }),
  actions: {
    initializeBoard() {
      this.board = initializeBoard();
    },
    setMovePlayer(color: 'white' | 'black') {
      const changeColor = color === 'white' ? 'black' : 'white';
      this.whoMoveNow = changeColor;
    },
    setSquarePossibleMove(position: IPosition): boolean {
      return this.possibleMove.some((pos) => pos.x === position.x && pos.y === position.y);
    },
    setPossibleMove(possiblePosition: IPosition[]) {
      this.possibleMove = [...possiblePosition];
    },
    selectPiece(square: ISquare) {
      if (square.state.type && square.state.color === this.whoMoveNow) {
        this.selectedPiece = square.state;
      }
    },
    dropPiece(square: ISquare) {
      if (!this.selectedPiece) {
        return;
      }
      const selectPiece = this.selectedPiece;
      if (square.state.type !== null) {
        this.capturePiece(square);
      }

      this.movePiece(selectPiece, square);
      if (this.selectedPiece.color) {
        this.setMovePlayer(this.selectedPiece.color);
      }

      this.resetSelection();
    },
    movePiece(selectPiece: IPiece, dropSquare: ISquare) {
      const oldPosition = { ...selectPiece.position };

      selectPiece.position = dropSquare.state.position;
      dropSquare.state = selectPiece;
      //изменение стейта для отслеживания возможности рокировки
      if (selectPiece.type === 'king') {
        this.stateMoveKing = true;
      }
      if (selectPiece.type === 'tower') {
        this.stateMoveTower = true;
      }

      const oldSquare = this.board[oldPosition.y][oldPosition.x];
      oldSquare.state = { type: null, color: null, position: oldPosition };
    },
    capturePiece(dropSquare: ISquare) {
      if (dropSquare.state.type) {
        if (dropSquare.state.color === 'white') {
          this.whitePiecesReset.push(dropSquare.state);
        } else {
          this.blackPiecesReset.push(dropSquare.state);
        }
      }
    },
    resetPossibleMove() {
      this.possibleMove = [];
    },
    resetSelection() {
      this.selectedPiece = null;
      this.droppedPiece = null;
    },
  },
});
