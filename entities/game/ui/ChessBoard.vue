<!-- entities/game/ui/ChessBoard.vue -->
<template>
    <div class="chess-board">
        <div v-for="(row, rowIndex) in board" :key="rowIndex" class="board-row">
            <div v-for="(piece, colIndex) in row" :key="colIndex" class="board-cell" :class="{
                'white-cell': (rowIndex + colIndex) % 2 === 0,
                'black-cell': (rowIndex + colIndex) % 2 !== 0,
                'selected': isSelected(rowIndex, colIndex),
                'valid-move': isValidMove(rowIndex, colIndex),
                'check': isCheck && isKing(rowIndex, colIndex),
                'checking-piece': isCheckingPiece(rowIndex, colIndex)
            }" @click="handleCellClick(rowIndex, colIndex)">
                <chess-piece v-if="piece" :piece="piece" />
            </div>
        </div>
    </div>
    <div v-if="gameStore.currentGame && gameStore.currentGame.status === 'completed'">
        <h2>Game Over</h2>
        <p v-if="gameStore.currentGame.winner">
            Winner: {{ gameStore.currentGame.winner }}
        </p>
        <p v-else>
            Game ended in a draw
        </p>
    </div>
    <button @click="handleForcedEndGame" class="forfeit-button">Exit Game</button>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import ChessPiece from './ChessPiece.vue';
import type { ChessBoard, PieceColor } from '~/entities/game/model/board.model';
import type { Position } from '~/features/game-logic/model/pieces/types';
import { useGameStore } from '~/store/game';
import { getValidMoves } from '~/features/game-logic/model/game-logic/moves';
import { isKingInCheck } from '~/features/game-logic/model/game-logic/check';
import type { ChessGame } from '../model/game.model';
const props = defineProps<{
    game: ChessGame;
    board: ChessBoard;
    currentTurn: PieceColor;
}>();


const emit = defineEmits<{
    (e: 'move', from: Position, to: Position): void;
}>();

const gameStore = useGameStore();
const selectedCell = ref<Position | null>(null);
const validMoves = ref<Position[]>([]);
const isCheck = computed(() => isKingInCheck(props.game).inCheck);

const isKing = (row: number, col: number) => {
    const piece = props.board[row][col];
    return piece && piece.type === 'king' && piece.color === props.currentTurn;
};

const isCheckingPiece = (row: number, col: number) => {
    return props.game.checkingPieces.some(pos => pos[0] === row && pos[1] === col);
};

const isSelected = (row: number, col: number) => {
    return selectedCell.value && selectedCell.value[0] === row && selectedCell.value[1] === col;
};

const isValidMove = (row: number, col: number) => {
    return validMoves.value.some(move => move[0] === row && move[1] === col);
};

const handleForcedEndGame = async () => {
    try {
        await gameStore.forcedEndGame();
    } catch (error) {
        console.error('Error ending game:', error);
    }
};

const handleCellClick = (row: number, col: number) => {
    console.log(`Cell clicked: [${row}, ${col}]`);
    console.log('Current game state:', props.game);
    if (!selectedCell.value) {
        const clickedPiece = props.board[row][col];
        console.log('Clicked piece:', clickedPiece);

        if (clickedPiece?.color === props.currentTurn) {
            selectedCell.value = [row, col];
            console.log('Selected cell:', selectedCell.value);

            // Получаем возможные ходы для выбранной фигуры
            validMoves.value = getValidMoves(props.game, selectedCell.value);
            console.log('Valid moves:', validMoves.value);
        } else {
            console.log('Cannot select this piece: wrong color or empty cell');
        }
    } else {
        const from = selectedCell.value;
        const to: Position = [row, col];
        console.log(`Attempting move from [${from}] to [${to}]`);

        // Проверяем, что ход входит в список допустимых ходов
        const isValidMove = validMoves.value.some(move => move[0] === row && move[1] === col);
        console.log('Is valid move:', isValidMove);

        if (isValidMove) {
            // Проверяем, что это не "ход" на ту же позицию
            if (from[0] !== to[0] || from[1] !== to[1]) {
                try {
                    console.log('Emitting move event');
                    emit('move', from, to);
                } catch (error) {
                    console.error('Error performing move:', error);
                }
            } else {
                console.log('Cannot move to the same position');
            }
        } else {
            console.log('Invalid move: not in the list of valid moves');
        }

        // Сбрасываем выбор и валидные ходы
        selectedCell.value = null;
        validMoves.value = [];
        console.log('Reset selection and valid moves');
    }
};
watch(() => props.game, () => {
    if (selectedCell.value) {
        validMoves.value = getValidMoves(props.game, selectedCell.value);
    }
}, { deep: true });
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

.selected {
    background-color: rgba(255, 255, 0, 0.5);
}

.valid-move {
    background-color: rgba(0, 255, 0, 0.3);
}

.check {
    border-color: rgba(255, 0, 0, 0.5);
}

.checking-piece {
    border-color: rgba(255, 165, 0, 0.5);
}

.forfeit-button {
    margin-top: 10px;
    padding: 5px 10px;
    background-color: #f44336;
    color: white;
    border: none;
    cursor: pointer;
}
</style>