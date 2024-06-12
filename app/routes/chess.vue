<template>
    <div>
        <h1>Игра в шахматы</h1>
        <Board />
    </div>
</template>

<script setup lang="ts">
import Board from '@/entities/board/ui/Board.vue';

</script>

<style scoped>
h1 {
    color: #333;
}
</style>