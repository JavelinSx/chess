<script setup lang="ts">
import type { IPiece } from '@/entities/piece/model/Piece'

const props = defineProps<{
    piece: IPiece
}>()

</script>

<template>
    <div class="piece" :class="[props.piece.color, props.piece.type]" />
</template>

<style scoped>
/* Styles for chess pieces */
.piece {
    height: 70%;
    width: 70%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.white {
    border: 1px solid black;
    background-color: rgb(224, 224, 220);
}

.black {
    border: 1px solid white;
    background-color: rgb(70, 70, 70);
}
</style>
