<template>
    <UCard class="chess-board-container sm:px-1">
        <template #header>
            <ChessTimer :duration="gameStore.currentGame?.timeControl?.initialTime"
                :player-color="gameStore.currentGame?.currentTurn!" @time-up="handleTimeUp" />
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
                @click="forfeitGame()">
                {{ t('game.forfeitGame') }}
            </UButton>
        </template>
    </UCard>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import ChessPiece from './ChessPiece.vue';
import PawnPromotionDialog from '~/features/game-logic/ui/PawnPromotionDialog.vue';
import { isDraw } from '~/features/game-logic/model/game-state/draw';
import { useGameStore } from '~/store/game';
import { useUserStore } from '~/store/user';
import { getValidMoves } from '~/features/game-logic/model/game-logic/moves';
import { isKingInCheck } from '~/features/game-logic/model/game-logic/check';
import ChessTimer from './ChessTimer.vue';
import { useGameAdditionalStore } from '~/store/gameAdditional';
import type { PieceType, Position, GameResult, GameResultReason } from '~/server/types/game';
export type GameEndReason = 'checkmate' | 'stalemate' | 'draw' | 'forfeit' | 'timeout';

const { t } = useI18n();
const gameStore = useGameStore();
const userStore = useUserStore();
const gameAdditionalStore = useGameAdditionalStore()

const selectedCell = ref<Position | null>(null);
const validMoves = ref<Position[]>([]);

const currentGame = computed(() => gameStore.currentGame);
const isCheck = computed(() => currentGame.value ? isKingInCheck(currentGame.value).inCheck : false);
const isUserPlayingWhite = computed(() => gameStore.currentGame?.players.white === userStore.user?._id);
const promote = computed(() => gameStore.promote)

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

const currentPlayerAvatar = computed(() => userStore.user?.avatar);
const isCurrentPlayerTurn = computed(() => currentPlayerId.value === userStore.user?._id);

function getCellClasses(row: number, col: number) {
    const [adjustedRow, adjustedCol] = getAdjustedPosition(row, col);
    const isLightSquare = isUserPlayingWhite.value
        ? (row + col) % 2 === 0
        : (row + col) % 2 !== 0;

    return {
        'bg-beige': isLightSquare,
        'bg-brown': !isLightSquare,
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
    if (isCurrentPlayerTurn.value && gameStore.pendingPromotion) {
        const { from, to } = gameStore.pendingPromotion;
        gameStore.promotePawn(promoteTo);
    }
}

async function handleCellClick(position: Position) {
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
            const piece = currentGame.value.board[from[0]][from[1]];
            if (piece?.type === 'pawn' && (to[0] === 0 || to[0] === 7)) {
                gameStore.pendingPromotion = { from, to };
                gameStore.promote = true;
            } else {
                await gameStore.makeMove(from, to);
            }
        }
        selectedCell.value = null;
        validMoves.value = [];
    }
}

const checkGameEnd = () => {
    if (!gameStore.currentGame || gameStore.currentGame.status === 'completed') return;

    if (gameStore.currentGame.isCheckmate) {
        handleGameEnd('checkmate');
    } else if (gameStore.currentGame.isStalemate) {
        handleGameEnd('stalemate');
    } else if (isDraw(gameStore.currentGame)) {
        handleGameEnd('draw');
    }
};

const handleGameEnd = async (reason: 'checkmate' | 'stalemate' | 'draw' | 'forfeit' | 'timeout') => {
    if (!gameStore.currentGame) return;

    const result: GameResult = {
        winner: null,
        loser: null,
        reason
    };

    // Определяем победителя и проигравшего в зависимости от причины
    if (reason === 'forfeit' && currentPlayerId.value) {
        // При сдаче текущий игрок проигрывает
        result.loser = currentPlayerId.value;
        result.winner = gameStore.currentGame.players[
            gameStore.currentGame.currentTurn === 'white' ? 'black' : 'white'
        ];
    } else if (reason === 'checkmate') {
        // При мате текущий игрок проигрывает
        result.loser = gameStore.currentGame.players[gameStore.currentGame.currentTurn];
        result.winner = gameStore.currentGame.players[
            gameStore.currentGame.currentTurn === 'white' ? 'black' : 'white'
        ];
    } else if (reason === 'timeout') {
        // При окончании времени проигрывает тот, у кого оно закончилось
        const timeoutColor = gameStore.currentGame.currentTurn;
        result.loser = gameStore.currentGame.players[timeoutColor];
        result.winner = gameStore.currentGame.players[timeoutColor === 'white' ? 'black' : 'white'];
    }
    // При пате или ничьей winner и loser остаются null

    await gameStore.handleGameEnd(result);
};

// Обработчики различных событий окончания игры
const forfeitGame = () => {
    handleGameEnd('forfeit');
};

const handleTimeUp = () => {
    handleGameEnd('timeout');
};

// Один watch вместо нескольких
watch(
    () => gameStore.currentGame,
    (game) => {
        if (game) checkGameEnd();
    },
    { deep: true }
);

onMounted(() => {
    if (gameStore.currentGame) {
        gameAdditionalStore.initializeGameTime();
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