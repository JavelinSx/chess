import { defineStore } from 'pinia';
import { ISquare, IPiece, IPosition } from '@/types';
import { initializeBoard } from './initializeBoard';
import { getPossibleMoves, isInCheck, setBlockingMoves, resetStates, copyBoard } from '@/shared/helpers';

interface ChessState {
  board: ISquare[][];
  selectedPiece: IPiece | null;
  droppedPiece: ISquare | null;
  blackPiecesReset: IPiece[];
  whitePiecesReset: IPiece[];
  whiteKing: IPiece | null;
  blackKing: IPiece | null;
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
  blockingMove: boolean | null;
  attackCoordinates: IPosition[] | null;
}

export const useChessStore = defineStore('chess', {
  state: (): ChessState => {
    const { board, whiteKing, blackKing } = initializeBoard();
    return {
      board,
      selectedPiece: null,
      droppedPiece: null,
      blackPiecesReset: [] as IPiece[],
      whitePiecesReset: [] as IPiece[],
      whiteKing,
      blackKing,
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
      blockingMove: null,
      attackCoordinates: null,
    };
  },
  actions: {
    initializeBoard() {
      const { board, whiteKing, blackKing } = initializeBoard();
      this.board = board;
      this.whiteKing = whiteKing;
      this.blackKing = blackKing;
    },
    // Устанавливаем, кто ходит следующим
    setMovePlayer(color: 'white' | 'black') {
      const changeColor = color === 'white' ? 'black' : 'white';
      this.whoMoveNow = changeColor;
    },
    // Проверка, является ли клетка возможным ходом
    setSquarePossibleMove(position: IPosition): boolean {
      return this.possibleMove.some((pos) => pos.x === position.x && pos.y === position.y);
    },
    // Устанавливаем возможные ходы
    setPossibleMove(possiblePosition: IPosition[]) {
      this.possibleMove = [...possiblePosition];
    },
    // Выбор фигуры
    selectPiece(square: ISquare) {
      if (square.state.type && square.state.color === this.whoMoveNow && !square.state.blockingMove) {
        this.selectedPiece = square.state;
      }
    },
    // Сброс фигуры на новую клетку
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

      this.checkForCheckAndMate();
      this.resetSelection();
    },
    // Перемещение фигуры
    movePiece(selectPiece: IPiece, dropSquare: ISquare) {
      const oldPosition = { ...selectPiece.position };

      selectPiece.position = dropSquare.state.position;
      dropSquare.state = selectPiece;
      // изменение стейта для отслеживания возможности рокировки
      if (selectPiece.type === 'king') {
        this.stateMoveKing = true;
        if (selectPiece.color === 'white') {
          this.whiteKing = selectPiece;
        } else {
          this.blackKing = selectPiece;
        }
      }
      if (selectPiece.type === 'tower') {
        this.stateMoveTower = true;
      }

      const oldSquare = this.board[oldPosition.y][oldPosition.x];
      oldSquare.state = { type: null, color: null, position: oldPosition };
    },
    // Захват фигуры
    capturePiece(dropSquare: ISquare) {
      if (dropSquare.state.type) {
        if (dropSquare.state.color === 'white') {
          this.whitePiecesReset.push(dropSquare.state);
        } else {
          this.blackPiecesReset.push(dropSquare.state);
        }
      }
    },
    // Проверка шаха и мата
    checkForCheckAndMate() {
      const king = this.whoMoveNow === 'white' ? this.whiteKing : this.blackKing;
      console.log('Проверка шаха и мата');
      if (king) {
        const attackCoords = isInCheck(this.board, king);
        console.log('Атакующие координаты:', attackCoords);
        if (attackCoords.length) {
          this.stateCheck = true;
          this.attackCoordinates = attackCoords;
          const blockingMoves = this.getBlockingMoves(king, attackCoords);
          const kingMoves = this.getKingMoves(king);

          console.log('Блокирующие ходы:', blockingMoves);
          console.log('Ходы короля:', kingMoves);

          this.setPossibleMove([...blockingMoves, ...kingMoves]);
          this.blockingMove = true;

          setBlockingMoves(this.board, blockingMoves, king);

          if (blockingMoves.length === 0 && kingMoves.length === 0) {
            this.stateCheckMate = true;
            console.log('Шах и мат');
          } else {
            this.stateCheckMate = false;
          }
        } else {
          this.resetCheckStates();
        }
      } else {
        this.resetCheckStates();
      }
    },
    // Получение блокирующих ходов
    getBlockingMoves(king: IPiece, attackCoordinates: IPosition[]): IPosition[] {
      const blockingMoves: IPosition[] = [];

      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const piece = this.board[y][x].state;
          if (piece.color === king.color) {
            const possibleMoves = getPossibleMoves(
              this.board,
              piece,
              this.stateMoveKing,
              this.stateMoveTower,
              this.stateCheck,
              king
            );
            for (const move of possibleMoves) {
              const tempBoard = copyBoard(this.board);
              const fromSquare = tempBoard[piece.position.y][piece.position.x];
              const toSquare = tempBoard[move.y][move.x];

              toSquare.state = { ...fromSquare.state, position: { x: move.x, y: move.y } };
              fromSquare.state = {
                type: null,
                color: null,
                position: { x: fromSquare.state.position.x, y: fromSquare.state.position.y },
              };

              const inCheck = isInCheck(tempBoard, king);
              if (!inCheck.length) {
                blockingMoves.push(move);
              }
            }
          }
        }
      }
      console.log('Блокирующие ходы вычислены:', blockingMoves);
      return blockingMoves;
    },
    // Получение возможных ходов короля
    getKingMoves(king: IPiece): IPosition[] {
      const kingMoves = getPossibleMoves(
        this.board,
        king,
        this.stateMoveKing,
        this.stateMoveTower,
        this.stateCheck,
        king
      );
      const validKingMoves = kingMoves.filter((move) => {
        const tempBoard = copyBoard(this.board);
        const fromSquare = tempBoard[king.position.y][king.position.x];
        const toSquare = tempBoard[move.y][move.x];

        toSquare.state = { ...fromSquare.state, position: { x: move.x, y: move.y } };
        fromSquare.state = {
          type: null,
          color: null,
          position: { x: fromSquare.state.position.x, y: fromSquare.state.position.y },
        };

        const inCheck = isInCheck(tempBoard, { ...king, position: { x: move.x, y: move.y } });
        return !inCheck.length;
      });
      console.log('Возможные ходы короля:', validKingMoves);
      return validKingMoves;
    },
    // Сброс состояний шаха и мата
    resetCheckStates() {
      this.stateCheck = false;
      this.attackCoordinates = null;
      this.blockingMove = false;
      this.stateCheckMate = false;
      console.log('Сброс состояний шаха и мата');
      resetStates(this.board);
    },
    // Сброс возможных ходов
    resetPossibleMove() {
      this.possibleMove = [];
    },
    // Сброс выбора
    resetSelection() {
      this.selectedPiece = null;
      this.droppedPiece = null;
    },
  },
});
