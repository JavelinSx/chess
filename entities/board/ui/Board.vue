<template>
    <div class="white-piece-reset">
        <div class="piece-wrapper" v-for="piece in whitePieceReset">
            <Piece :piece="piece"></Piece>
        </div>
    </div>

    <div class="board" @mousemove="handleMouseMove">
        <template v-for="(row, rowIndex) in board" :key="rowIndex">
            <Square :class="chessStore.setSquarePossibleMove({ x: colIndex, y: rowIndex }) ? '' : ''"
                v-for="(square, colIndex) in row" :key="colIndex" :square="square" :rowIndex="rowIndex"
                :colIndex="colIndex" />
        </template>
        <div v-if="chessStore.selectedPiece" :style="pieceStyle" class="piece-mouse">
            <Piece :piece="chessStore.selectedPiece" />
        </div>
    </div>

    <div class="black-piece-reset">
        <div class="piece-wrapper" v-for="piece in blackPieceReset">
            <Piece :piece="piece"></Piece>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useChessStore } from '@/stores/chess/chessStore';
import Square from '@/entities/board/ui/Square.vue';
import Piece from '@/entities/piece/ui/Piece.vue';

const chessStore = useChessStore();
chessStore.initializeBoard();

const board = computed(() => chessStore.board);
const whitePieceReset = chessStore.whitePiecesReset
const blackPieceReset = chessStore.blackPiecesReset
const mouseMove = ref({ x: 0, y: 0 });
let animationFrameId: number | null = null;

const handleMouseMove = (e: MouseEvent) => {
    if (chessStore.selectedPiece) {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(() => {
            mouseMove.value = {
                x: e.clientX,
                y: e.clientY
            };
        });
    }
};

watch(mouseMove, (newVal) => {
    if (chessStore.selectedPiece) {
        chessStore.mouseMove = newVal;
    }
});

const pieceStyle = computed(() => (`left:${chessStore.mouseMove.x - 720}px; top:${chessStore.mouseMove.y - 370}px; position: absolute; pointer-events: none; transform: translate(-50%,-50%)`));
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
    position: relative;
    /* Ensure the board is the positioning context */
}

.piece-mouse {
    width: 40px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
}

.black-piece-reset {
    display: flex;
    flex-direction: row;
    height: 50px;
    padding: 20px;
}

.white-piece-reset {
    display: flex;
    flex-direction: row;
    height: 50px;
    padding: 20px;
}

.piece-wrapper {
    width: 40px;

}
</style>