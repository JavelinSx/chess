import { defineStore } from "pinia";
import { IPosition, ISquare } from "@/entities/piece/model/Piece";
import { initializeBoard } from '@/stores/chess/initializeBoard';

interface ChessState {
    board: ISquare[][];
    currentTurn: 'white' | 'black';
}

export const useChessStore = defineStore('chess', {
    state: (): ChessState => ({
        board: [],
        currentTurn: 'white',
    }),
    actions: {
        initializeBoard() {
            this.board = initializeBoard();
        },
        movePiece(from: IPosition, to: IPosition) {
            const fromSquare = this.board[from.y][from.x];
            const toSquare = this.board[to.y][to.x];
            
            if (fromSquare.piece) {
                toSquare.piece = fromSquare.piece;
                fromSquare.piece = null;
                toSquare.piece.position = to;
                this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
            }
        }
    }
});
