import { defineStore } from 'pinia';
import { ISquare, IPosition, IPiece } from '@/types/chess/types';
import { initializeBoard } from './initializeBoard';
import {
  getPossibleMoves,
  isInCheck,
  setBlockingMoves,
  resetStates,
  copyBoard,
  executeCastling,
} from '@/shared/helpers/chessLogic';
import { isSameColor, isSameSquare } from '@/shared/helpers/chessLogic';

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
  castlingWhite: boolean;
  castlingBlack: boolean;
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
      castlingWhite: false,
      castlingBlack: false,
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
        this.selectedPiece = square.state as IPiece;
        this.calculatePossibleMoves();
      }
    },
    //Вычисление возможных ходов
    calculatePossibleMoves() {
      if (this.selectedPiece) {
        const board = this.board;
        const king = this.whoMoveNow === 'white' ? this.whiteKing : this.blackKing;
        const possibleMoves = getPossibleMoves(
          board,
          this.selectedPiece,
          this.stateMoveKing,
          this.stateMoveTower,
          this.stateCheck,
          king
        );
        this.setPossibleMove(possibleMoves);
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
          this.whitePiecesReset.push(dropSquare.state as IPiece);
        } else {
          this.blackPiecesReset.push(dropSquare.state as IPiece);
        }
      }
    },
    // Проверка состояния шаха и мата
    checkForCheckAndMate() {
      const king = this.whoMoveNow === 'white' ? this.whiteKing : this.blackKing;
      if (king) {
        // Проверяем, находится ли король под шахом
        const attackCoords = isInCheck(this.board, king);
        if (attackCoords.length) {
          this.stateCheck = true;
          this.attackCoordinates = attackCoords;
          // Получаем ходы для блокировки шаха и ходы короля
          const blockingMoves = this.getBlockingMoves(king);
          const kingMoves = this.getKingMoves(king);

          this.setPossibleMove([...blockingMoves, ...kingMoves]);
          this.blockingMove = true;

          setBlockingMoves(this.board, blockingMoves, king);

          // Если нет блокирующих ходов и ходов короля, это мат
          if (blockingMoves.length === 0 && kingMoves.length === 0) {
            this.stateCheckMate = true;
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
    // Перемещение выбранной фигуры на указанную клетку
    handlePieceMove(square: ISquare) {
      const selectedPiece = this.selectedPiece;
      if (!selectedPiece) return;

      const isValidMove = this.possibleMove.some(
        (move) => move.x === square.state.position.x && move.y === square.state.position.y
      );

      if (isSameSquare(selectedPiece, square) || isSameColor(selectedPiece, square) || !isValidMove) {
        this.resetSelection();
      } else {
        if (selectedPiece.type === 'king' && Math.abs(square.state.position.x - selectedPiece.position.x) === 2) {
          this.handleCastlingMove(square, selectedPiece);
        }
        this.dropPiece(square);
        this.resetPossibleMove();
      }
    },
    // Выполнение хода рокировки
    handleCastlingMove(square: ISquare, selectedPiece: IPiece) {
      const rookX = square.state.position.x === selectedPiece.position.x + 2 ? 7 : 0;
      const rookY = selectedPiece.position.y;
      const rook = this.board[rookY][rookX].state;
      const king = selectedPiece;
      if (rook.type) {
        executeCastling(this.board, king, rook);
      }
    },
    // Получение блокирующих ходов
    getBlockingMoves(king: IPiece): IPosition[] {
      const blockingMoves: IPosition[] = [];
      // Проходим по всей доске
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const piece = this.board[y][x].state;
          // Проверяем, совпадает ли цвет фигуры с цветом короля
          if (piece.color === king.color) {
            const possibleMoves = getPossibleMoves(
              this.board,
              piece,
              this.stateMoveKing,
              this.stateMoveTower,
              this.stateCheck,
              king
            );
            // Проходим все возможные ходы для фигуры
            for (const move of possibleMoves) {
              // Создаем временную копию доски
              const tempBoard = copyBoard(this.board);
              const fromSquare = tempBoard[piece.position.y][piece.position.x];
              const toSquare = tempBoard[move.y][move.x];

              // Выполняем перемещение фигуры на временной доске
              toSquare.state = { ...fromSquare.state, position: { x: move.x, y: move.y } };
              fromSquare.state = {
                type: null,
                color: null,
                position: { x: fromSquare.state.position.x, y: fromSquare.state.position.y },
              };

              // Проверяем, находится ли король под шахом после этого хода
              const inCheck = isInCheck(tempBoard, king);
              if (!inCheck.length) {
                // Если король не под шахом, добавляем этот ход в список блокирующих ходов
                blockingMoves.push(move);
              }
            }
          }
        }
      }
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
      // Проверяем каждый возможный ход короля
      const validKingMoves = kingMoves.filter((move) => {
        // Создаем временную копию доски
        const tempBoard = copyBoard(this.board);
        const fromSquare = tempBoard[king.position.y][king.position.x];
        const toSquare = tempBoard[move.y][move.x];

        // Выполняем перемещение короля на временной доске
        toSquare.state = { ...fromSquare.state, position: { x: move.x, y: move.y } };
        fromSquare.state = {
          type: null,
          color: null,
          position: { x: fromSquare.state.position.x, y: fromSquare.state.position.y },
        };

        // Проверяем, находится ли король под шахом после этого хода
        const inCheck = isInCheck(tempBoard, { ...king, position: { x: move.x, y: move.y } });
        // Возвращаем ходы, при которых король не под шахом
        return !inCheck.length;
      });
      return validKingMoves;
    },
    // Сброс состояний шаха и мата
    resetCheckStates() {
      this.stateCheck = false;
      this.attackCoordinates = null;
      this.blockingMove = false;
      this.stateCheckMate = false;
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
      this.possibleMove = [];
    },
  },
});
