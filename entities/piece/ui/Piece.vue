<template>
    <img :src="props.piece.icon" class="piece" :class="[props.piece.color, props.piece.type]" />
</template>

<script setup lang="ts">
import type { IPiece } from '@/types';

const props = defineProps<{
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

.white {}

.black {}
</style>
