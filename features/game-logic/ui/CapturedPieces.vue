<template>
    <div class="captured-pieces">
        <UCard>
            <template #header>
                <h3 class="text-lg font-semibold">{{ t('capturedPieces') }}</h3>
            </template>
            <div class="flex justify-between">
                <div class="captured-white">
                    <h4 class="text-sm font-medium mb-2">{{ t('white') }}</h4>
                    <div class="flex flex-wrap gap-1">
                        <TransitionGroup name="piece">
                            <div v-for="(piece, index) in whitePieces" :key="`white-${index}`" class="piece">
                                {{ getPieceSymbol(piece, 'white') }}
                            </div>
                        </TransitionGroup>
                    </div>
                </div>
                <div class="captured-black">
                    <h4 class="text-sm font-medium mb-2">{{ t('black') }}</h4>
                    <div class="flex flex-wrap gap-1">
                        <TransitionGroup name="piece">
                            <div v-for="(piece, index) in blackPieces" :key="`black-${index}`" class="piece">
                                {{ getPieceSymbol(piece, 'black') }}
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
const { t } = useI18n();
const props = defineProps<{
    capturedPieces: {
        white: PieceType[];
        black: PieceType[];
    }
}>();

const whitePieces = computed(() => props.capturedPieces.white);
const blackPieces = computed(() => props.capturedPieces.black);

function getPieceSymbol(type: PieceType, color: 'white' | 'black'): string {
    const symbols = {
        king: color === 'white' ? '♔' : '♚',
        queen: color === 'white' ? '♕' : '♛',
        rook: color === 'white' ? '♖' : '♜',
        bishop: color === 'white' ? '♗' : '♝',
        knight: color === 'white' ? '♘' : '♞',
        pawn: color === 'white' ? '♙' : '♟'
    };
    return symbols[type];
}
</script>

<style scoped lang="scss">
.captured-pieces {
    @apply w-full max-w-md mx-auto mt-4;
}

.piece {
    @apply text-2xl w-8 h-8 flex items-center justify-center;
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