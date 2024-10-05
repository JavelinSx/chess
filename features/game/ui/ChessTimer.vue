<template>
    <UCard :ui="{ base: 'bg-gray-100 dark:bg-gray-800 p-4 rounded-lg' }">
        <div class="text-2xl font-bold">{{ formattedTime }}</div>
    </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useGameAdditionalStore } from '~/store/gameAdditional';
import { storeToRefs } from 'pinia';

const gameAdditionalStore = useGameAdditionalStore();
const { timeRemaining, gameStatus } = storeToRefs(gameAdditionalStore);

const formattedTime = computed(() => {
    const minutes = Math.floor(timeRemaining.value / 60);
    const seconds = Math.floor(timeRemaining.value % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

let intervalId: ReturnType<typeof setInterval> | null = null;

const startTimer = () => {
    if (intervalId === null) {
        intervalId = setInterval(() => {
            gameAdditionalStore.updateGameTime();
        }, 1000);
    }
};

const stopTimer = () => {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
};

onMounted(() => {
    console.log("ChessTimer mounted, game status:", gameStatus.value);
    if (gameStatus.value === 'active') {
        startTimer();
    }
});

onUnmounted(() => {
    stopTimer();
});

watch(gameStatus, (newStatus) => {
    console.log("Game status changed to:", newStatus);
    if (newStatus === 'active') {
        startTimer();
    } else {
        stopTimer();
    }
});
</script>