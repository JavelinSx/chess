import { defineStore } from "pinia";
import { IPosition, ISquare, IPiece } from "@/entities/piece/model/Piece";
import { initializeBoard } from '@/stores/chess/initializeBoard';

interface ChessState {
    board: ISquare[][];
    currentTurn: boolean;
    selectedPiece: ISquare | null;
    droppedPiece: ISquare | null;
    blackPiecesReset: IPiece[];
    whitePiecesReset: IPiece[];
    mouseMove: {
        x: number,
        y: number
    }
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
            y: 0
        }
    }),
    actions: {
        initializeBoard() {
            this.board = initializeBoard();
        },
        handleSquareClick(square: ISquare) {
            if (!this.selectedPiece) {
                this.selectPiece(square);
            } else {
                if (this.isSameSquare(this.selectedPiece, square) || this.isSameColor(this.selectedPiece, square)) {
                    this.resetSelection();
                } else {
                    this.dropPiece(square);
                }
            }
        },
        selectPiece(square: ISquare) {
            if(square.piece !==null){
                this.selectedPiece = square;
            }
        },
        dropPiece(square: ISquare) {
            if (!this.selectedPiece) return; // добавлена проверка на null
            this.droppedPiece = square;
            const dropPiece = this.droppedPiece;
            const selectPiece = this.selectedPiece;

            if (dropPiece.piece) {
                this.capturePiece(dropPiece);
            }

            this.movePiece(selectPiece, dropPiece);
            this.currentTurn = !this.currentTurn;
            this.resetSelection();
        },
        resetSelection() {
            this.selectedPiece = null;
            this.droppedPiece = null;
        },
        isSameColor(selectPiece: ISquare, dropPiece: ISquare): boolean{
            if(selectPiece.piece && dropPiece.piece){
                return selectPiece.piece.color===dropPiece.piece.color
            } return false
        },
        isSameSquare(selectPiece: ISquare, dropPiece: ISquare): boolean {
            return selectPiece.position.x === dropPiece.position.x &&
                   selectPiece.position.y === dropPiece.position.y;
        },
        capturePiece(dropPiece: ISquare) {
            if (dropPiece.piece) {
                if (dropPiece.piece.color === 'white') {
                    this.whitePiecesReset.push(dropPiece.piece);
                } else {
                    this.blackPiecesReset.push(dropPiece.piece);
                }
                const resetSquare = this.board[dropPiece.position.y][dropPiece.position.x];
                resetSquare.piece = null;
            }
        },
        movePiece(selectPiece: ISquare, dropPiece: ISquare) {
            if (!selectPiece.piece) return; // добавлена проверка на null
            selectPiece.position = dropPiece.position;
            dropPiece.piece = selectPiece.piece;
            selectPiece.piece = null;
        }
    }
});
