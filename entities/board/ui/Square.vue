<template>
    <div :class="['square', squareClass]" @click="handleClick(square)">
        <Piece v-if="square.piece" :piece="square.piece" />
    </div>
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue';
import { ISquare } from '@/entities/piece/model/Piece';
import Piece from '@/entities/piece/ui/Piece.vue';
import { useChessStore } from '@/stores/chess/chessStore';

const chessStore = useChessStore();

const props = defineProps({
    square: {
        type: [Object, null] as PropType<ISquare>,
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
    chessStore.handleSquareClick(square);
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