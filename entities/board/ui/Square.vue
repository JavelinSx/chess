<template>
    <div :class="['square', squareClass]" @click="handleClick(square)">
        <Piece v-if="square.state.type" :piece="square.state" />
    </div>
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue';
import type { ISquare } from '@/types';
import Piece from '@/entities/piece/ui/Piece.vue';
import { useChessStore } from '@/stores/chess/chessStore';
import { isSameColor, isSameSquare } from '@/shared/helpers/boardLogic';
import { validLogicMove } from '@/shared/helpers/validLogicMove';
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

const squareClass = computed(() => {
    return (props.rowIndex + props.colIndex) % 2 === 0 ? 'white-square' : 'black-square';
});

const handleClick = (square: ISquare) => {
    const selectedPiece = chessStore.selectedPiece;
    const board = chessStore.board;

    if (!selectedPiece) {
        chessStore.selectPiece(square);
    } else {
        const isValidMove = validLogicMove(board, square, selectedPiece);

        if (isSameSquare(selectedPiece, square) || isSameColor(selectedPiece, square) || !isValidMove) {
            chessStore.resetSelection();
        } else {
            chessStore.dropPiece(square);
        }
    }
};
</script>

<style scoped>
.square {
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.white-square {
    background-color: #f0d9b5;
}

.black-square {
    background-color: #b58863;
}
</style>