<template>
    <div class="white-piece-reset">
        <div class="piece-wrapper" v-for="piece in whitePieceReset">
            <Piece :piece="piece"></Piece>
        </div>
    </div>

    <div class="board" @mousemove="handleMouseMove" @mousedown="handleMouseDown">
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
    <div>
        <h2 v-if="stateCheck">Шах</h2>
        <h2 v-if="stateCheckMate">Мат</h2>
    </div>

</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useChessStore } from '@/stores/chess/chessStore';

const chessStore = useChessStore();
chessStore.initializeBoard();

const stateCheck = computed(() => chessStore.stateCheck);
const stateCheckMate = computed(() => chessStore.stateCheckMate);
const board = computed(() => chessStore.board);
const whitePieceReset = chessStore.whitePiecesReset;
const blackPieceReset = chessStore.blackPiecesReset;
const mouseMove = ref({ x: 0, y: 0 });
let animationFrameId: number | null = null;

const handleMouseMove = (e: MouseEvent) => {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(() => {
        mouseMove.value = {
            x: e.clientX,
            y: e.clientY
        };
    });
};

const handleMouseDown = (e: MouseEvent) => {
    mouseMove.value = {
        x: e.clientX,
        y: e.clientY
    };
};

// Watch for changes in selectedPiece and update mouseMove accordingly
watch(() => chessStore.selectedPiece, (newSelectedPiece) => {
    if (newSelectedPiece) {
        // Update mouseMove to current cursor position immediately
        const event = window.event as MouseEvent;
        mouseMove.value = {
            x: event.clientX,
            y: event.clientY
        };
    }
});

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
    border-radius: 10px;
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
    height: 40px;
    padding: 10px;
    border: 1px solid black;
    min-width: 300px;
    margin-top: 30px;

}

.white-piece-reset {
    display: flex;
    flex-direction: row;
    height: 40px;
    padding: 10px;
    border: 1px solid black;
    min-width: 300px;
    margin-bottom: 30px;
}

.piece-wrapper {}
</style>
