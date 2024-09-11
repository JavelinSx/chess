<template>
    <UCard class="chess-board-container">
        <template #header>
            <h3 class="text-lg font-semibold">Chess Board</h3>
        </template>
        <UCard :ui="cardStyle" class="mb-4">
            <template #header>
                <p class="text-sm">Current turn: {{ gameStore?.currentGame?.currentTurn }}</p>
            </template>
            <template #footer>
                <p class="text-sm">Your color: {{ playerColor }}</p>
                <p class="text-sm" v-if="gameStore?.currentGame?.status === 'completed'">
                    Game over! Winner: {{ gameStore.currentGame.winner || 'Draw' }}
                </p>
            </template>
        </UCard>

        <div class="chess-board">
            <div class="board-vertical-labels">
                <div v-for="row in 8" :key="row" class="cell flex items-start">
                    {{ isUserPlayingWhite ? 9 - row : row }}
                </div>
            </div>
            <div class="board-grid">
                <div v-for="col in 8" :key="col" class="board-row">
                    <div v-for="row in 8" :key="row" class="board-cell" :class="[
                        ((row + col) % 2 === 0) ? 'bg-beige' : 'bg-brown',
                        {
                            'highlight-selected': isSelected(isUserPlayingWhite ? 8 - row : row - 1, col - 1),
                            'highlight-valid-move': isValidMove(isUserPlayingWhite ? 8 - row : row - 1, col - 1),
                            'highlight-check': isCheck && isKing(isUserPlayingWhite ? 8 - row : row - 1, col - 1),
                            'highlight-checking-piece': isCheckingPiece(isUserPlayingWhite ? 8 - row : row - 1, col - 1)
                        }
                    ]" @click="handleCellClick(isUserPlayingWhite ? 8 - row : row - 1, col - 1)">
                        <chess-piece :piece="board[isUserPlayingWhite ? 8 - row : row - 1][col - 1]" />
                    </div>
                </div>
            </div>
            <div class="board-horizontal-labels">
                <div v-for="col in 'ABCDEFGH'" :key="col" class="cell">{{ col }}</div>
            </div>
        </div>
        <PawnPromotionDialog v-if="gameStore.promote"
            :color="gameStore.currentGame?.currentTurn === 'white' ? 'black' : 'white'" @select="handlePromotion" />
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

const cardStyle = ref({
    header: {
        padding: 'p-2' // Измененный padding
    },
    footer: {
        padding: 'p-2' // Измененный padding
    },
});

const props = defineProps<{
    game: ChessGame;
    board: ChessBoard;
    currentTurn: PieceColor;
}>();

const emit = defineEmits<{
    (e: 'move', from: Position, to: Position): void;
}>();
const playerColor = computed(() => {
    if (gameStore.currentGame) {
        if (gameStore.currentGame.players.white === userStore._id) {
            return 'White';
        } else if (gameStore.currentGame.players.black === userStore._id) {
            return 'Black';
        }
    }
    return 'Unknown';
});
const userStore = useUserStore()
const gameStore = useGameStore();
const selectedCell = ref<Position | null>(null);
const validMoves = ref<Position[]>([]);
const isCheck = computed(() => isKingInCheck(props.game).inCheck);
const currentGame = computed(() => gameStore.currentGame);

const isUserPlayingWhite = computed(() => {
    return gameStore.currentGame?.players.white === userStore.user?._id;
});

const isCurrentPlayerTurn = computed(() => {
    if (!currentGame.value || !userStore.user) return false;
    const currentPlayerId = currentGame.value.currentTurn === 'white'
        ? currentGame.value.players.white
        : currentGame.value.players.black;
    return currentPlayerId === userStore.user._id;
});

const handlePromotion = (promoteTo: PieceType) => {
    if (isCurrentPlayerTurn.value) {
        gameStore.promotePawn(promoteTo);
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
    if (!isCurrentPlayerTurn.value) return;

    if (!selectedCell.value) {
        const clickedPiece = currentGame.value?.board[row][col];
        if (clickedPiece?.color === currentGame.value?.currentTurn && currentGame.value) {
            selectedCell.value = [row, col];
            validMoves.value = getValidMoves(currentGame.value, selectedCell.value);
        }
    } else {
        const from = selectedCell.value;
        const to: Position = [row, col];
        if (isValidMove(row, col) && (from[0] !== to[0] || from[1] !== to[1])) {
            gameStore.makeMove(from, to);
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

    display: grid;
    grid-template-areas:
        ". h h h h h"
        "v b b b b b"
        "v b b b b b"
        "v b b b b b"

}

.board-vertical-labels {
    grid-area: v;
}

.board-horizontal-labels {
    grid-area: h;
    display: flex;
}

.board-grid {
    @apply inline-grid grid-cols-8;
    grid-area: b;

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
    width: 2rem;
    height: 2rem;

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

    .cell,
    .board-cell {
        width: 2.5rem;
        height: 2.5rem;
    }
}

@screen md {

    .cell,
    .board-cell {
        width: 3rem;
        height: 3rem;
    }
}

@screen lg {

    .cell,
    .board-cell {
        width: 3.5rem;
        height: 3.5rem;
    }
}

.board-labels {
    .cell {
        width: 100%;
        height: 100%;
    }
}
</style>