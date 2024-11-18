<!-- features/game/ui/ChessTimer.vue -->
<template>
    <UCard :ui="{ base: timerClasses }">
        <div class="flex justify-between items-center">
            <div class="timer-display" :class="{ 'active': isWhiteActive }">
                <span class="font-bold">White:</span>
                <span>{{ formatTime(whiteTimeRemaining) }}</span>
            </div>
            <div class="timer-display" :class="{ 'active': isBlackActive }">
                <span class="font-bold">Black:</span>
                <span>{{ formatTime(blackTimeRemaining) }}</span>
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGameAdditionalStore } from '~/store/gameAdditional';
import { useGameStore } from '~/store/game';
import { storeToRefs } from 'pinia';
import type { PieceColor } from '~/server/types/game';

const gameStore = useGameStore();
const gameAdditionalStore = useGameAdditionalStore();

const { whiteTimeRemaining, blackTimeRemaining, gameStatus, activeTimer } = storeToRefs(gameAdditionalStore);
let intervalId: ReturnType<typeof setInterval> | null = null;

// Определяем активный таймер
const isWhiteActive = computed(() => activeTimer.value === 'white');
const isBlackActive = computed(() => activeTimer.value === 'black');

// Классы для стилизации активного таймера
const timerClasses = computed(() => ({
    'bg-gray-100 dark:bg-gray-800 p-4 rounded-lg': true,
    'border-l-4': true,
    'border-green-500': gameStatus.value === 'active',
    'border-red-500': gameStatus.value === 'completed',
    'border-gray-500': gameStatus.value === 'not_started',
}));

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

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

// Смена таймера
watch(() => gameStore.currentGame?.currentTurn, (newTurn, oldTurn) => {
    if (newTurn && newTurn !== oldTurn && gameStore.currentGame?.status === 'active') {
        console.log(`Switching timer from ${oldTurn} to ${newTurn}`);
        gameAdditionalStore.switchTimer();
    }
}, { deep: true });

onMounted(() => {
    gameAdditionalStore.initializeGameTime();
    if (gameStatus.value === 'active') {
        startTimer();
    }
});

onUnmounted(() => {
    stopTimer();
});

// Следим за статусом игры
watch(gameStatus, (newStatus) => {
    if (newStatus === 'active') {
        startTimer();
    } else {
        stopTimer();
    }
});
// Следим за изменением состояния игры
watch(() => gameStore.currentGame?.status, (newStatus) => {
    if (newStatus === 'completed') {
        gameAdditionalStore.resetGame();
    }
});
</script>

<style scoped>
.timer-display {
    @apply px-4 py-2 rounded;
    transition: all 0.3s ease;
}

.timer-display.active {
    @apply bg-green-100 dark:bg-green-900;
}

.time {
    @apply font-mono text-xl;
}
</style>