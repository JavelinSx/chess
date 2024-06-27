<template>
    <div class="chess">
        <Board />
    </div>
</template>

<script setup lang="ts">
import Board from '~/entities/board/ui/Board.vue';
definePageMeta({
    middleware: ["auth"]
})
</script>

<style scoped>
h1 {
    color: #333;
}

.chess {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
}
</style>