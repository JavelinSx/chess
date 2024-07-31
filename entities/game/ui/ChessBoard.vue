<!-- entities/game/ui/ChessBoard.vue -->
<template>
    <div class="chess-board">
        <div v-for="(row, rowIndex) in board" :key="rowIndex" class="board-row">
            <div v-for="(piece, colIndex) in row" :key="colIndex" class="board-cell"
                :class="{ 'white-cell': (rowIndex + colIndex) % 2 === 0, 'black-cell': (rowIndex + colIndex) % 2 !== 0 }"
                @click="handleCellClick(rowIndex, colIndex)">
                <chess-piece v-if="piece" :piece="piece" />
            </div>
        </div>

    </div>
    <button @click="handleForcedEndGame" class="forfeit-button">Exit Game</button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import ChessPiece from './ChessPiece.vue';
import type { ChessBoard, PieceColor } from '~/entities/game/model/board.model';
import { useGameStore } from '~/store/game';

defineProps<{
    board: ChessBoard;
    currentTurn: PieceColor;
}>();

const emit = defineEmits<{
    (e: 'move', from: [number, number], to: [number, number]): void;
}>();

const gameStore = useGameStore();
console.log('Game Store:', gameStore); // Добавьте эту строку для отладки
const { currentGame, error } = storeToRefs(gameStore);
const selectedCell = ref<[number, number] | null>(null);

const handleForcedEndGame = async () => {
    try {
        console.log('Attempting to end game...'); // Добавьте эту строку
        await gameStore.forcedEndGame();
        console.log('Game ended successfully'); // Добавьте эту строку
        navigateTo('/')
    } catch (error) {
        console.error('Error ending game:', error);
    }
};

function handleCellClick(row: number, col: number) {
    if (!selectedCell.value) {
        // Если ячейка не выбрана, выбираем её
        selectedCell.value = [row, col];
    } else {
        // Если ячейка уже выбрана, пытаемся сделать ход
        emit('move', selectedCell.value, [row, col]);
        selectedCell.value = null;
    }
}

onUnmounted(() => {
    gameStore.resetError();
});
</script>

<style scoped>
.chess-board {
    display: inline-block;
    border: 2px solid #333;
}

.board-row {
    display: flex;
}

.board-cell {
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.white-cell {
    background-color: #f0d9b5;
}

.black-cell {
    background-color: #b58863;
}
</style>