<template>
    <div v-if="piece" class="chess-piece" :class="piece.color">
        {{ getPieceSymbol(piece.type, piece.color) }}
    </div>
</template>

<script setup lang="ts">
import type { ChessPiece } from '~/entities/game/model/board.model';

const props = defineProps<{
    piece: ChessPiece | null;
}>();

function getPieceSymbol(type: string, color: string): string {
    if (!type || !color) return '';
    const symbols = {
        king: color === 'white' ? '♔' : '♚',
        queen: color === 'white' ? '♕' : '♛',
        rook: color === 'white' ? '♖' : '♜',
        bishop: color === 'white' ? '♗' : '♝',
        knight: color === 'white' ? '♘' : '♞',
        pawn: color === 'white' ? '♙' : '♟'
    };
    return symbols[type as keyof typeof symbols] || '';
}
</script>

<style lang="scss" scoped>
.chess-piece {
    @apply text-2xl cursor-pointer;

    &.white {
        @apply text-white;
        text-shadow:
            -1px -1px 0 theme('colors.gray.800'),
            1px -1px 0 theme('colors.gray.800'),
            -1px 1px 0 theme('colors.gray.800'),
            1px 1px 0 theme('colors.gray.800');
    }

    &.black {
        @apply text-gray-900;
        text-shadow:
            -1px -1px 0 theme('colors.white'),
            1px -1px 0 theme('colors.white'),
            -1px 1px 0 theme('colors.white'),
            1px 1px 0 theme('colors.white');
    }
}

@screen sm {
    .chess-piece {
        @apply text-3xl;
    }
}

@screen md {
    .chess-piece {
        @apply text-4xl;
    }
}

@screen lg {
    .chess-piece {
        @apply text-5xl;
    }
}
</style>