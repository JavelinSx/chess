<template>
    <UCard class="chess-board-container">
        <template #header>
            <h3 class="text-lg font-semibold">{{ t('game.chessBoard') }}</h3>
        </template>

        <UCard :ui="{ header: { padding: 'py-4' } }" class="mb-4">
            <template #header>
                <div class="flex items-center space-x-2">
                    <UAvatar :src="currentPlayerAvatar" :alt="currentPlayerName" size="sm" />
                    <p class="text-sm">{{ t('game.playerTurn', { name: currentPlayerName }) }}</p>
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
                @click="handleEndGame('forfeit')">
                {{ t('game.forfeitGame') }}
            </UButton>
        </template>
    </UCard>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { gameApi } from '~/shared/api/game';
import ChessPiece from './ChessPiece.vue';
import PawnPromotionDialog from '~/features/game-logic/ui/PawnPromotionDialog.vue';
import type { PieceType, Position, GameResult, GameResultReason } from '~/server/types/game';
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

const currentPlayerId = computed(() =>
    gameStore.currentGame?.currentTurn === 'white'
        ? gameStore.currentGame.players.white
        : gameStore.currentGame?.players.black
);

const currentPlayerName = computed(() => {
    if (currentPlayerId.value === userStore.user?._id) {
        return userStore.user?.username || 'Your';
    } else {
        const opponent = userStore.usersList.find(user => user._id === currentPlayerId.value);
        return opponent ? opponent.username : 'Opponent\'s';
    }
});

const currentPlayerAvatar = computed(() => 'https://via.placeholder.com/40');
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
    if (!currentGame.value) return null;
    const [adjustedRow, adjustedCol] = getAdjustedPosition(row, col);
    return currentGame.value.board[adjustedRow]?.[adjustedCol] ?? null;
}

function isKing(row: number, col: number) {
    const piece = getPieceAt(row, col);
    return piece && piece.type === 'king' && piece.color === currentGame.value?.currentTurn;
}

function isSelected(row: number, col: number) {
    return selectedCell.value && selectedCell.value[0] === row && selectedCell.value[1] === col;
}

function isValidMove(row: number, col: number) {
    return validMoves.value.some(move => move[0] === row && move[1] === col);
}

function isCheckingPiece(row: number, col: number) {
    return currentGame.value?.checkingPieces.some((pos: Position) => pos[0] === row && pos[1] === col) ?? false;
}

function handlePromotion(promoteTo: PieceType) {
    if (isCurrentPlayerTurn.value) {
        gameStore.promotePawn(promoteTo);
    }
}

function handleEndGame(reason: NonNullable<GameResultReason>) {
    if (!gameStore.currentGame) return;

    let result: GameResult = {
        winner: null,
        loser: null,
        reason: reason
    };

    if (reason === 'checkmate' || reason === 'forfeit') {
        result.winner = gameStore.currentGame.currentTurn === 'white' ? gameStore.currentGame.players.black : gameStore.currentGame.players.white;
        result.loser = gameStore.currentGame.currentTurn === 'white' ? gameStore.currentGame.players.white : gameStore.currentGame.players.black;
    }

    gameStore.handleGameEnd(result);
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

watch(() => gameStore.gameResult, async (newResult) => {
    if (newResult) {
        try {
            const updatedStats = await gameApi.updateGameStats(gameStore.currentGame!.id, newResult);
            if (updatedStats.data && userStore.user) {
                const currentUserStats = updatedStats.data[userStore.user._id];
                if (currentUserStats) {
                    userStore.updateUserStats(currentUserStats);
                }
            }
        } catch (error) {
            console.error('Failed to update game stats:', error);
        }
    }
});

watch(() => gameStore.gameResult, (newResult) => {
    if (newResult && newResult.reason) {
        handleEndGame(newResult.reason);
    }
});

onUnmounted(() => {
    gameStore.resetError();
});
</script>

<style lang="scss" scoped>
.chess-board-container {
    @apply max-w-xl mx-auto w-full;
}

.chess-board {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto 1fr;
    grid-template-areas:
        ". h h"
        "v b b";
    max-width: 100%;
    aspect-ratio: 1 / 1;
}

.board-vertical-labels {
    grid-area: v;
    display: flex;
    flex-direction: column-reverse;
    padding-right: 15px
}

.board-horizontal-labels {
    grid-area: h;
    display: flex;
    padding-bottom: 10px;
}

.board-grid {
    grid-area: b;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    aspect-ratio: 1 / 1;
}

.board-cell {
    aspect-ratio: 1 / 1;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

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

.cell {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

.board-labels {
    @apply text-sm font-medium text-gray-600;

    &.horizontal {
        @apply flex mb-1;
    }

    &.vertical {
        @apply flex flex-col-reverse mr-1;
    }

    .cell {
        width: 100%;
        height: 100%;
    }
}

// Удалены медиа-запросы для .cell и .board-cell, так как теперь используется grid и aspect-ratio</style>