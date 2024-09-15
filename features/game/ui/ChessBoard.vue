<template>
    <UCard class="chess-board-container">
        <template #header>
            <h3 class="text-lg font-semibold">{{ t('chessBoard') }}</h3>
        </template>
        <UCard :ui="{ header: { padding: 'py-4' } }" class="mb-4">
            <template #header>
                <div class="flex items-center space-x-2">
                    <UAvatar :src="currentPlayerAvatar" :alt="currentPlayerName" size="sm" />
                    <p class="text-sm">{{ t('playerTurn', { name: currentPlayerName }) }}</p>
                </div>
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
                    <div v-for="row in 8" :key="row" class="board-cell" :class="getCellClasses(row, col)"
                        @click="handleCellClick(getAdjustedPosition(row, col))">
                        <chess-piece :piece="getPieceAt(row, col)" />
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
                {{ t('forfeitGame') }}
            </UButton>
        </template>
    </UCard>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import ChessPiece from './ChessPiece.vue';
import PawnPromotionDialog from '~/features/game-logic/ui/PawnPromotionDialog.vue';
import type { PieceType, Position } from '~/server/types/game';
import { useGameStore } from '~/store/game';
import { useUserStore } from '~/store/user';
import { getValidMoves } from '~/features/game-logic/model/game-logic/moves';
import { isKingInCheck } from '~/features/game-logic/model/game-logic/check';
const { t } = useI18n();
const gameStore = useGameStore();
const userStore = useUserStore();

const selectedCell = ref<Position | null>(null);
const validMoves = ref<Position[]>([]);

const currentGame = computed(() => gameStore.currentGame);
const isCheck = computed(() => currentGame.value ? isKingInCheck(currentGame.value).inCheck : false);

const isUserPlayingWhite = computed(() => gameStore.currentGame?.players.white === userStore.user?._id);

const currentPlayerId = computed(() => {
    return gameStore.currentGame?.currentTurn === 'white'
        ? gameStore.currentGame.players.white
        : gameStore.currentGame?.players.black;
});

const currentPlayerName = computed(() => {
    if (currentPlayerId.value === userStore.user?._id) {
        return userStore.user?.username || 'Your';
    } else {
        const opponent = userStore.usersList.find(user => user._id === currentPlayerId.value);
        return opponent ? opponent.username : 'Opponent\'s';
    }
});

const currentPlayerAvatar = computed(() => {
    // Здесь логика получения аватара текущего игрока
    // Пример: return userStore.getAvatarUrl(currentPlayerId.value);
    return 'https://via.placeholder.com/40';
});

const isCurrentPlayerTurn = computed(() => currentPlayerId.value === userStore.user?._id);

function getCellClasses(row: number, col: number) {
    const [adjustedRow, adjustedCol] = getAdjustedPosition(row, col);
    return {
        'bg-beige': (row + col) % 2 === 0,
        'bg-brown': (row + col) % 2 !== 0,
        'highlight-selected': isSelected(adjustedRow, adjustedCol),
        'highlight-valid-move': isValidMove(adjustedRow, adjustedCol),
        'highlight-check': isCheck.value && isKing(adjustedRow, adjustedCol),
        'highlight-checking-piece': isCheckingPiece(adjustedRow, adjustedCol)
    };
}

function getAdjustedPosition(row: number, col: number): Position {
    return isUserPlayingWhite.value ? [8 - row, col - 1] : [row - 1, col - 1];
}

function getPieceAt(row: number, col: number) {
    const [adjustedRow, adjustedCol] = getAdjustedPosition(row, col);
    return currentGame.value?.board[adjustedRow][adjustedCol] ?? null;
}

function isSelected(row: number, col: number) {
    return selectedCell.value && selectedCell.value[0] === row && selectedCell.value[1] === col;
}

function isValidMove(row: number, col: number) {
    return validMoves.value.some(move => move[0] === row && move[1] === col);
}

function isKing(row: number, col: number) {
    const piece = getPieceAt(row, col);
    return piece && piece.type === 'king' && piece.color === currentGame.value?.currentTurn;
}

function isCheckingPiece(row: number, col: number) {
    return currentGame.value?.checkingPieces.some((pos: Position) => pos[0] === row && pos[1] === col) ?? false;
}

function handlePromotion(promoteTo: PieceType) {
    if (isCurrentPlayerTurn.value) {
        gameStore.promotePawn(promoteTo);
    }
}

async function handleForcedEndGame() {
    try {
        await gameStore.forcedEndGame();
    } catch (error) {
        console.error('Error ending game:', error);
    }
}

function handleCellClick(position: Position) {
    if (!isCurrentPlayerTurn.value || !currentGame.value) return;

    const [row, col] = position;
    if (!selectedCell.value) {
        const clickedPiece = currentGame.value.board[row][col];
        if (clickedPiece?.color === currentGame.value.currentTurn) {
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
}

watch(() => currentGame.value, () => {
    if (selectedCell.value && currentGame.value) {
        validMoves.value = getValidMoves(currentGame.value, selectedCell.value);
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