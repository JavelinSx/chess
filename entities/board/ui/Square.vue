<template>
    <div :class="['square', isPossibleMove ? 'possible-move' : '', squareClass]" @click="handleClick(square)">
        <Piece v-if="square.state.type" :piece="square.state" />
    </div>
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue';
import type { ISquare, IPiece } from '@/types';
import Piece from '@/entities/piece/ui/Piece.vue';
import { useChessStore } from '@/stores/chess/chessStore';
import { isSameColor, isSameSquare } from '@/shared/helpers/boardLogic';
import { getPossibleMoves } from '@/shared/helpers/getPossibleMoves';
import { executeCastling } from '@/shared/helpers/castlingLogic';

const chessStore = useChessStore();

const props = defineProps({
    square: {
        type: Object as PropType<ISquare>,
        required: true,
    },
    rowIndex: {
        type: Number,
        required: true,
    },
    colIndex: {
        type: Number,
        required: true,
    }
});

// Вычисляемый класс для клетки доски
const squareClass = computed(() => {
    return (props.rowIndex + props.colIndex) % 2 === 0 ? 'white-square' : 'black-square';
});

// Вычисляемое свойство, определяющее, является ли клетка возможным ходом
const isPossibleMove = computed(() => {
    return chessStore.possibleMove.some(move => move.y === props.rowIndex && move.x === props.colIndex);
});

// Обработчик клика по клетке
const handleClick = (square: ISquare) => {
    const selectedPiece = chessStore.selectedPiece;
    const board = chessStore.board;

    if (!selectedPiece) {
        // Если фигура не выбрана, выбираем фигуру
        handlePieceSelection(square);
    } else {
        // Если фигура выбрана, пытаемся сделать ход
        handlePieceMove(square, selectedPiece, board);
    }
};

// Функция для выбора фигуры
const handlePieceSelection = (square: ISquare) => {
    chessStore.selectPiece(square);
    if (chessStore.selectedPiece) {
        const board = chessStore.board;
        const getStateMoveKing = chessStore.stateMoveKing;
        const getStateMoveTower = chessStore.stateMoveTower;
        const getStateCheck = chessStore.stateCheck;
        const possibleMoves = getPossibleMoves(board, chessStore.selectedPiece, getStateMoveKing, getStateMoveTower, getStateCheck);
        chessStore.setPossibleMove(possibleMoves);
    }
};

// Функция для выполнения хода фигуры
const handlePieceMove = (square: ISquare, selectedPiece: IPiece, board: ISquare[][]) => {
    const isValidMove = chessStore.possibleMove.some(
        move => move.x === square.state.position.x && move.y === square.state.position.y
    );

    if (isSameSquare(selectedPiece, square) || isSameColor(selectedPiece, square) || !isValidMove) {
        // Сбрасываем выбор, если кликнули на ту же клетку или на клетку с фигурой того же цвета, или ход невалиден
        chessStore.resetSelection();
    } else {
        // Проверка и выполнение рокировки
        if (selectedPiece.type === 'king' && Math.abs(square.state.position.x - selectedPiece.position.x) === 2) {
            handleCastlingMove(square, selectedPiece, board);
        }
        // Выполнение хода
        chessStore.dropPiece(square);
        chessStore.resetPossibleMove();
    }
};

// Функция для выполнения рокировки
const handleCastlingMove = (square: ISquare, selectedPiece: IPiece, board: ISquare[][]) => {
    const rookX = square.state.position.x === selectedPiece.position.x + 2 ? 7 : 0;
    const rookY = selectedPiece.position.y;
    const rook = board[rookY][rookX].state;
    executeCastling(board, selectedPiece, rook);
};
</script>

<style scoped>
.square {
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
}

.white-square {
    background-color: #f0d9b5;
}

.black-square {
    background-color: #b58863;
}

.possible-move {
    border: 1px solid green;
}
</style>