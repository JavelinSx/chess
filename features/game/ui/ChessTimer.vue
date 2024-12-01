<template>
    <UCard :ui="{
        body: {
            base: '',
            background: '',
            padding: 'px-4 py-5 sm:p-2 md:p-6'
        },
    }">
        <template v-if="timerStore.isCountingDown">
            <div class="countdown-display text-center">
                <h3 class="text-xl font-bold mb-2">{{ t('game.gameStartsIn') }}</h3>
                <span class="text-3xl">{{ timerStore.countdownTime }}</span>
            </div>
        </template>
        <template v-else>
            <div class="flex justify-between items-center">
                <div class="timer-display" :class="{ 'active': activeColor === 'white' }">
                    <span class="font-bold">White:</span>
                    <span>{{ formatTimeValue(timerStore.remainingTime('white')) }}</span>
                </div>
                <div class="timer-display" :class="{ 'active': activeColor === 'black' }">
                    <span class="font-bold">Black:</span>
                    <span>{{ formatTimeValue(timerStore.remainingTime('black')) }}</span>
                </div>
            </div>
        </template>
    </UCard>
</template>

<script setup lang="ts">
import { useGameStore } from '~/store/game';
import { useGameTimerStore } from '~/store/gameTimer';
import type { PieceColor } from '~/server/types/game';
import { gameApi } from '~/shared/api/game';

const { t } = useI18n();

const gameStore = useGameStore();
const timerStore = useGameTimerStore();

const { activeColor } = storeToRefs(timerStore)
const { whiteTime } = storeToRefs(timerStore)
const { blackTime } = storeToRefs(timerStore)

const formatTimeValue = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const syncInterval = ref<NodeJS.Timeout | null>(null);

const startTimerSync = () => {
    if (syncInterval.value) {
        clearInterval(syncInterval.value);
    }

    syncInterval.value = setInterval(async () => {
        if (!gameStore.currentGame || timerStore.status !== 'active') return;

        try {
            await gameApi.updateTimer(
                gameStore.currentGame._id,
                timerStore.whiteTime,
                timerStore.blackTime
            );
        } catch (error) {
            console.error('Timer sync error:', error);
        }
    }, 5000);
};

const stopTimerSync = () => {
    if (syncInterval.value) {
        clearInterval(syncInterval.value);
        syncInterval.value = null;
    }
};

// Добавляем наблюдение за статусом таймера
watch(() => timerStore.status, (newStatus) => {
    if (newStatus === 'active') {
        startTimerSync();
    } else {
        stopTimerSync();
    }
});

onMounted(async () => {
    const game = gameStore.currentGame;
    if (!game) return;

    await timerStore.initialize(
        game._id,
        game.timeControl?.initialTime
    );

    if (timerStore.status === 'countdown' && !timerStore.isCountingStarted) {
        timerStore.startCountdown();
    } else if (timerStore.status === 'active') {
        // Если игра уже активна (например после перезагрузки)
        startTimerSync();
    }
});

onBeforeUnmount(() => {
    stopTimerSync();
    timerStore.cleanup();
});
</script>

<style scoped>
.timer-display {
    @apply px-4 py-2 rounded transition-colors duration-300;
}

.timer-display.active {
    @apply bg-green-100 dark:bg-green-900;
}

.countdown-display {
    @apply p-4;
}
</style>