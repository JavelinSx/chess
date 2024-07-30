<!-- entities/game/ui/ChessPiece.vue -->
<template>
    <div class="chess-piece" :class="[piece.color, piece.type]">
        {{ getPieceSymbol(piece.type, piece.color) }}
    </div>
</template>

<script setup lang="ts">
import type { ChessPiece } from '~/entities/game/model/board.model';

const props = defineProps<{
    piece: ChessPiece;
}>();

function getPieceSymbol(type: string, color: string): string {
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

<style scoped>
.chess-piece {
    font-size: 2em;
    cursor: pointer;
}

.white {
    color: #fff;
    text-shadow: 0 0 2px #000;
}

.black {
    color: #000;
    text-shadow: 0 0 2px #fff;
}
</style>