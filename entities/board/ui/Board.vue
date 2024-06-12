<template>
    <div class="board">
        <template v-for="(row, rowIndex) in board" :key="rowIndex">
            <Square v-for="(square, colIndex) in row" :key="colIndex" :square="square" :rowIndex="rowIndex"
                :colIndex="colIndex" />
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useChessStore } from '@/stores/chess/chessStore';
import Square from '@/entities/board/ui/Square.vue';

const chessStore = useChessStore();
chessStore.initializeBoard();

const board = computed(() => chessStore.board);


</script>

<style scoped>
.board {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    gap: 1px;
    justify-items: center;
    align-items: center;
    justify-content: center;
    align-content: center;
    width: min-content;
}
</style>
