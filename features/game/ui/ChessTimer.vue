<template>
    <UCard :ui="{ base: 'bg-gray-100 dark:bg-gray-800 p-4 rounded-lg' }">
        <div class="text-2xl font-bold">{{ formatTime(remainingTime) }}</div>
    </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '~/store/game';

const props = defineProps<{
    duration: number;
    playerColor: 'white' | 'black';
}>();

const gameStore = useGameStore();

const remainingTime = ref(props.duration * 60);
let timer: ReturnType<typeof setInterval> | null = null;

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const startTimer = () => {
    if (timer === null && gameStore.currentGame?.currentTurn === props.playerColor) {
        timer = setInterval(() => {
            remainingTime.value--;
            if (remainingTime.value <= 0) {
                stopTimer();
                gameStore.handleTimeUp(props.playerColor);
            }
        }, 1000);
    }
};

const stopTimer = () => {
    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }
};

onMounted(() => {
    if (gameStore.currentGame?.currentTurn === props.playerColor) {
        startTimer();
    }
});

onUnmounted(() => {
    stopTimer();
});

watch(() => gameStore.currentGame?.currentTurn, (newTurn) => {
    if (newTurn === props.playerColor) {
        startTimer();
    } else {
        stopTimer();
    }
});

defineExpose({ remainingTime });
</script>