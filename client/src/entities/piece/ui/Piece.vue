<template>
    <img :src="piece.icon" class="piece" :class="[piece.color, piece.type]" />
</template>

<script setup lang="ts">
import type { IPiece } from '~/types/chess/types';

defineProps<{
    piece: IPiece
}>();
</script>

<style scoped>
.piece {
    height: 35px;
    width: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
