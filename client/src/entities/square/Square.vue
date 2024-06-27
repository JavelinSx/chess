<template>
    <div :class="['square', isPossibleMove ? 'possible-move' : '', squareClass]" @click="handleClick">
        <Piece v-if="square.state.type" :piece="square.state" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from '#imports';
import type { ISquare } from '~/types/chess/types';

import Piece from '~/entities/piece/ui/Piece.vue';
import { useChessStore } from '~/stores/chess/chessStore';

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
const handleClick = () => {
    if (!chessStore.selectedPiece) {
        chessStore.selectPiece(props.square);
    } else {
        chessStore.handlePieceMove(props.square);
    }
};
</script>

<style lang="scss">
.square {
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    border: 1px solid black;
    position: relative;
}

.white-square {
    background-color: #f0d9b5;
}

.black-square {
    background-color: #b58863;
}

.possible-move {
    &::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 100%;
        background-color: rgb(86, 150, 86);
        z-index: 1;
    }
}
</style>
