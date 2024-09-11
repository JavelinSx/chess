<template>
    <div v-if="piece" class="chess-piece flex items-center justify-center" :class="[piece.color, 'piece-container']">
        <component :is="getPieceComponent(piece.type)" />
    </div>
</template>

<script setup lang="ts">
import type { ChessPiece } from '~/entities/game/model/board.model';

import ChessKnight from '~/app/styles/chess-icon/chess-knight.svg';
import ChessRook from '~/app/styles/chess-icon/chess-rook.svg';
import ChessBishop from '~/app/styles/chess-icon/chess-bishop.svg';
import ChessQueen from '~/app/styles/chess-icon/chess-queen.svg';
import ChessKing from '~/app/styles/chess-icon/chess-king.svg';
import ChessPawn from '~/app/styles/chess-icon/chess-pawn.svg';

const props = defineProps<{
    piece: ChessPiece | null;
}>();

function getPieceComponent(type: string) {
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
.chess-piece {
    @apply w-full h-full flex items-center justify-center;

    :deep(svg) {
        width: 80%;
        height: 80%;
        fill: none;
        stroke-width: 1;
    }

    &.white {
        :deep(svg) {
            stroke: theme('colors.white'); // Белая граница для белых фигур
        }
    }



}

:root.dark {
    .chess-piece {
        &.white {
            :deep(svg) {
                stroke: theme('colors.gray.200'); // Светлая граница для белых фигур в темной теме
            }
        }


    }
}

.piece-container {
    @apply flex items-center justify-center;
    height: 100%;
    width: 100%;
}
</style>