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
import { getPossibleMoves } from '@/shared/helpers';
import { isSameColor, isSameSquare } from '@/shared/helpers/boardLogic';
import { executeCastling } from '@/shared/helpers';

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
    console.log('Клик по клетке:', square);
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
    if (square.state.type && square.state.blockingMove) {
        console.log(`Фигура на клетке (${square.state.position.x}, ${square.state.position.y}) заблокирована для хода.`);
        return; // Не позволяем выбрать фигуру, если она заблокирована для хода
    }

    chessStore.selectPiece(square);
    if (chessStore.selectedPiece) {
        const board = chessStore.board;
        const getStateMoveKing = chessStore.stateMoveKing;
        const getStateMoveTower = chessStore.stateMoveTower;
        const getStateCheck = chessStore.stateCheck;
        const king = chessStore.whoMoveNow === 'white' ? chessStore.whiteKing : chessStore.blackKing;
        const possibleMoves = getPossibleMoves(board, chessStore.selectedPiece, getStateMoveKing, getStateMoveTower, getStateCheck, king);
        console.log(`Возможные ходы для выбранной фигуры (${chessStore.selectedPiece.type}):`, possibleMoves);
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
        console.log('Невалидный ход или клик на ту же клетку. Сбрасываем выбор.');
        chessStore.resetSelection();
    } else {
        // Проверка и выполнение рокировки
        if (selectedPiece.type === 'king' && Math.abs(square.state.position.x - selectedPiece.position.x) === 2) {
            handleCastlingMove(square, selectedPiece, board);
        }
        // Выполнение хода
        console.log(`Выполняем ход ${selectedPiece.type} (${selectedPiece.position.x}, ${selectedPiece.position.y}) на (${square.state.position.x}, ${square.state.position.y})`);
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
