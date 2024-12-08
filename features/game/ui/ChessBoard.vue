<template>
    <UCard class="chess-board-container sm:px-1">
        <template #header>
            <ChessTimer v-if="currentGame?.status === 'active'" :game-id="currentGame._id" />
            <p v-else class="w-full text-center text-xl">{{ t('game.gameOver') }}</p>
        </template>

        <UCard :ui="{ header: { padding: 'py-4' } }" class="mb-4">
            <template #header>
                <div class="flex items-center space-x-2">
                    <UAvatar :ui="{ rounded: 'object-cover' }" :src="currentPlayerAvatar" :alt="currentPlayerName"
                        size="sm" />
                    <p class="text-sm overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
                        {{ t('game.playerTurn', { name: currentPlayerName }) }}
                    </p>
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
                        <chess-piece :piece="getPieceAt(row, col)" :class="{
                            'piece-moving': isMovingPiece(row, col),
                            'piece-captured': isCapturedPiece(row, col)
                        }" />
                    </div>
                </div>
            </div>

            <div class="board-horizontal-labels">
                <div v-for="col in 'ABCDEFGH'" :key="col" class="cell">
                    {{ col }}
                </div>
            </div>
        </div>

        <PawnPromotionDialog v-if="gameStore.promote" :color="currentGame?.currentTurn === 'white' ? 'black' : 'white'"
            @select="handlePromotion" />

        <template #footer>
            <UButton v-if="currentGame?.status === 'active'" color="red" icon="i-heroicons-flag"
                @click="handleGameEnd('forfeit')">
                {{ t('game.forfeitGame') }}
            </UButton>
        </template>
    </UCard>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue';
import ChessTimer from './ChessTimer.vue';
import ChessPiece from './ChessPiece.vue';
import PawnPromotionDialog from './PawnPromotionDialog.vue';
import { useGameStore } from '~/stores/game';
import { useUserStore } from '~/stores/user';
import { useChessBoard } from '~/composables/game/useChessBoard';
import { useCurrentPlayer } from '~/composables/game/useCurrentPlayer';
import { useGameEnd } from '~/composables/game/useGameEnd';

const { t } = useI18n();
const gameStore = useGameStore();
const userStore = useUserStore();
const route = useRoute()

// Используем композаблы
const {
    currentGame,
    isUserPlayingWhite,
    isCurrentPlayerTurn,
    getAdjustedPosition,
    getPieceAt,
    handleCellClick,
    handlePromotion,
    getCellClasses,
    isMovingPiece,
    isCapturedPiece
} = useChessBoard();

const {
    currentPlayerName,
    currentPlayerAvatar
} = useCurrentPlayer(gameStore);

const {
    handleGameEnd,
    checkGameEnd
} = useGameEnd(gameStore);

// Следим за изменениями игры
watch(
    () => gameStore.currentGame,
    (game) => {
        if (game) checkGameEnd();
    },
    { deep: true }
);
onBeforeMount(async () => {
    const gameId = route.params.id as string;
    if (gameId) {
        await gameStore.fetchGame(gameId);
    }
});

onUnmounted(() => {
    gameStore.resetError();
});
</script>

<style lang="scss" scoped>
.piece-moving {
    animation: move-piece 0.3s ease-out;
    z-index: 2;
}

.piece-captured {
    animation: capture-piece 0.3s ease-out;
    z-index: 1;
}

@keyframes move-piece {
    0% {
        transform: scale(1.1) translate(0, 0);
        opacity: 0.8;
    }

    100% {
        transform: scale(1) translate(0, 0);
        opacity: 1;
    }
}

@keyframes capture-piece {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(0.8);
        opacity: 0.5;
    }

    100% {
        transform: scale(0);
        opacity: 0;
    }
}

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
    padding-right: 15px;
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
</style>