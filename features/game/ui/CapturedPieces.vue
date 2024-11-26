<template>
    <div class="captured-pieces">
        <UCard>
            <template #header>
                <h3 class="text-lg font-semibold">{{ t('game.capturedPieces') }}</h3>
            </template>
            <div class="flex justify-between">
                <div class="captured-white">
                    <h4 class="text-sm font-medium mb-2">{{ t('game.white') }}</h4>
                    <div class="flex flex-wrap gap-1">
                        <TransitionGroup name="piece">
                            <div v-for="(piece, index) in whitePieces" :key="`white-${index}`" class="piece">
                                <div class="chess-piece white piece-container">
                                    <component :is="getPieceComponent(piece)" />
                                </div>
                            </div>
                        </TransitionGroup>
                    </div>
                </div>
                <div class="captured-black">
                    <h4 class="text-sm font-medium mb-2">{{ t('game.black') }}</h4>
                    <div class="flex flex-wrap gap-1">
                        <TransitionGroup name="piece">
                            <div v-for="(piece, index) in blackPieces" :key="`black-${index}`" class="piece">
                                <div class="chess-piece black piece-container">
                                    <component :is="getPieceComponent(piece)" />
                                </div>
                            </div>
                        </TransitionGroup>
                    </div>
                </div>
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PieceType } from '~/server/types/game';
import ChessKnight from '~/app/styles/chess-icon/chess-knight.svg';
import ChessRook from '~/app/styles/chess-icon/chess-rook.svg';
import ChessBishop from '~/app/styles/chess-icon/chess-bishop.svg';
import ChessQueen from '~/app/styles/chess-icon/chess-queen.svg';
import ChessKing from '~/app/styles/chess-icon/chess-king.svg';
import ChessPawn from '~/app/styles/chess-icon/chess-pawn.svg';

const { t } = useI18n();
const props = defineProps<{
    capturedPieces: {
        white: PieceType[];
        black: PieceType[];
    }
}>();

const whitePieces = computed(() => props.capturedPieces.white);
const blackPieces = computed(() => props.capturedPieces.black);

function getPieceComponent(type: PieceType) {
    switch (type) {
        case 'knight': return ChessKnight;
        case 'rook': return ChessRook;
        case 'bishop': return ChessBishop;
        case 'queen': return ChessQueen;
        case 'king': return ChessKing;
        case 'pawn': return ChessPawn;
        default: return null;
    }
}
</script>

<style lang="scss" scoped>
.captured-pieces {
    @apply w-full max-w-xl mx-auto mt-4;
}

.piece {
    @apply w-8 h-8 flex items-center justify-center;
}

.chess-piece {
    @apply w-full h-full flex items-center justify-center;

    :deep(svg) {
        width: 80%;
        height: 80%;
        fill: none;
        stroke-width: .8;
    }

    &.white {
        :deep(svg) {
            stroke: theme('colors.white');

            path {
                fill: theme('colors.black');
            }
        }
    }

}

:root.dark {
    .chess-piece {
        &.white {
            :deep(svg) {
                stroke: theme('colors.white');

                path {
                    fill: theme('colors.black');
                }
            }
        }

    }
}

.piece-container {
    @apply flex items-center justify-center;
    height: 100%;
    width: 100%;
}

.piece-enter-active,
.piece-leave-active {
    transition: all 0.5s ease;
}

.piece-enter-from,
.piece-leave-to {
    opacity: 0;
    transform: translateY(30px);
}

.piece-move {
    transition: transform 0.5s ease;
}
</style>