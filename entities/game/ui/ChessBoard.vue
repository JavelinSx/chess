<template>
    <UCard class="chess-board-container">
        <template #header>
            <h3 class="text-lg font-semibold">Chess Board</h3>
        </template>
        <div class="chess-board">
            <div class="board-with-labels">
                <div class="board-labels vertical">
                    <div v-for="row in 8" :key="row" class="cell">{{ 9 - row }}</div>
                </div>
                <div>
                    <div class="board-labels horizontal">
                        <div v-for="col in 'ABCDEFGH'" :key="col" class="cell">{{ col }}</div>
                    </div>
                    <div class="board-grid">
                        <div v-for="row in 8" :key="row" class="flex">
                            <div v-for="col in 8" :key="col" class="board-cell" :class="[
                                ((row + col) % 2 === 0) ? 'bg-beige' : 'bg-brown',
                                {
                                    'highlight-selected': isSelected(8 - row, col - 1),
                                    'highlight-valid-move': isValidMove(8 - row, col - 1),
                                    'highlight-check': isCheck && isKing(8 - row, col - 1),
                                    'highlight-checking-piece': isCheckingPiece(8 - row, col - 1)
                                }
                            ]" @click="handleCellClick(8 - row, col - 1)">
                                <chess-piece :piece="board[8 - row][col - 1]" />
                            </div>
                        </div>
                    </div>
                    <PawnPromotionDialog v-if="promotion.status" :color="gameStore.currentGame?.currentTurn || 'white'"
                        @select="handlePromotion" />
                </div>
            </div>
        </div>
        <template #footer>
            <UButton v-if="gameStore.currentGame?.status === 'active'" color="red" icon="i-heroicons-flag"
                @click="handleForcedEndGame">
                Forfeit Game
            </UButton>
        </template>
    </UCard>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import ChessPiece from './ChessPiece.vue';
import PawnPromotionDialog from '~/features/game-logic/ui/PawnPromotionDialog.vue';
import type { ChessBoard, PieceColor } from '~/entities/game/model/board.model';
import type { Position } from '~/features/game-logic/model/pieces/types';
import type { PieceType } from '~/entities/game/model/board.model';
import type { ChessGame } from '../model/game.model';
import { useGameStore } from '~/store/game';
import { useUserStore } from '~/store/user';
import { getValidMoves } from '~/features/game-logic/model/game-logic/moves';
import { isKingInCheck } from '~/features/game-logic/model/game-logic/check';
import { isPawnPromotion } from '~/features/game-logic/model/game-logic/special-moves';


const props = defineProps<{
    game: ChessGame;
    board: ChessBoard;
    currentTurn: PieceColor;
}>();

const emit = defineEmits<{
    (e: 'move', from: Position, to: Position): void;
}>();
const userStore = useUserStore()
const gameStore = useGameStore();
const selectedCell = ref<Position | null>(null);
const validMoves = ref<Position[]>([]);
const isCheck = computed(() => isKingInCheck(props.game).inCheck);
const promotion = computed(() => gameStore.promotion)
const showPromotionDialog = computed(() => {

    if (!gameStore.currentGame || !gameStore.currentGame.pendingPromotion) {
        return false;
    }
    const currentPlayerId = gameStore.currentGame.currentTurn === 'white'
        ? gameStore.currentGame.players.white
        : gameStore.currentGame.players.black;
    return currentPlayerId === userStore.user?._id;
});

const handlePromotion = async () => {
    try {
        // Ожидание выбора фигуры пользователем
        const selectedPiece = await new Promise<PieceType>((resolve) => {
            const handleSelect = (piece: PieceType) => {
                resolve(piece);
            };


        });

        // После выбора фигуры вызвать sendPromotionChoice
        if (gameStore.promotion.to && selectedPiece) {
            await gameStore.sendPromotionChoice(gameStore.promotion.to, selectedPiece);
        }
    } catch (error) {
        console.error('Error during promotion:', error);
    } finally {

    }
};


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
    if (!selectedCell.value) {
        const clickedPiece = props.board[row][col];
        if (clickedPiece?.color === props.currentTurn) {
            selectedCell.value = [row, col];
            validMoves.value = getValidMoves(props.game, selectedCell.value);
        }
    } else {
        const from = selectedCell.value;
        const to: Position = [row, col];
        if (isValidMove(row, col) && (from[0] !== to[0] || from[1] !== to[1])) {
            try {
                emit('move', from, to);
            } catch (error) {
                console.error('Error making move:', error);
            }
        }
        selectedCell.value = null;
        validMoves.value = [];
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

<style lang="scss" scoped>
.chess-board-container {
    @apply max-w-fit mx-auto;
}

.chess-board {
    @apply p-2;
}

.board-with-labels {
    @apply flex;
}

.board-grid {
    @apply inline-grid grid-rows-8;
}

.board-labels {
    @apply text-sm font-medium text-gray-600;

    &.horizontal {
        @apply flex mb-1;
    }

    &.vertical {
        @apply flex flex-col-reverse mr-1;
    }
}

.cell,
.board-cell {
    @apply relative flex justify-center items-center;
    width: theme('width.8');
    height: theme('height.8');

    &.bg-beige {
        background-color: #f0d9b5;
    }

    &.bg-brown {
        background-color: #b58863;
    }

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 10;
    }

    &.highlight-selected::after {
        box-shadow: inset 0 0 0 2px theme('colors.yellow.400');
    }

    &.highlight-valid-move::after {
        box-shadow: inset 0 0 0 2px theme('colors.green.400');
    }

    &.highlight-check::after {
        box-shadow: inset 0 0 0 2px theme('colors.red.400');
    }

    &.highlight-checking-piece::after {
        box-shadow: inset 0 0 0 2px theme('colors.orange.400');
    }
}

@screen sm {
    .board-cell {
        width: theme('width.10');
        height: theme('height.10');
    }
}

@screen md {
    .board-cell {
        width: theme('width.12');
        height: theme('height.12');
    }
}

@screen lg {
    .board-cell {
        width: theme('width.14');
        height: theme('height.14');
    }
}
</style>