<template>
    <UCard :ui="{ base: cardClasses }">
        <template v-if="timerStore.initCountdown">
            <div class="countdown-display text-center">
                <h3 class="text-xl font-bold mb-2">{{ t('game.gameStartsIn') }}</h3>
                <span class="text-3xl">{{ timerStore.countdownTime }}</span>
            </div>
        </template>
        <template v-else>
            <div class="flex justify-between items-center">
                <div class="timer-display" :class="{ 'active': activeColor === 'white' }">
                    <span class="font-bold">White:</span>
                    <span>{{ formatTimeValue(whiteTime) }}</span>
                </div>
                <div class="timer-display" :class="{ 'active': activeColor === 'black' }">
                    <span class="font-bold">Black:</span>
                    <span>{{ formatTimeValue(blackTime) }}</span>
                </div>
            </div>
        </template>
    </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGameTimerStore } from '~/store/gameTimer';
import { useGameStore } from '~/store/game';
import { storeToRefs } from 'pinia';

const props = defineProps<{
    gameId: string;
}>();

const { t } = useI18n();
const timerStore = useGameTimerStore();
const gameStore = useGameStore();

const { whiteTime, blackTime, status, activeColor } = storeToRefs(timerStore);
let syncInterval = ref<ReturnType<typeof setInterval> | null>(null);
// Вычисляемые свойства
const cardClasses = computed(() => ({
    'bg-gray-100 dark:bg-gray-800 p-4 rounded-lg': true,
    'border-l-4': true,
    'border-yellow-500': status.value === 'countdown',
    'border-green-500': status.value === 'active',
    'border-red-500': status.value === 'completed',
    'border-gray-500': status.value === 'not_started',
}));

// Функции
const formatTimeValue = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Локальное обновление времени
const startTimeSync = () => {
    if (syncInterval.value) {
        return;
    };
    syncInterval.value = setInterval(() => {
        if (timerStore.status === 'active') {
            timerStore.updateTimeAndSync();
        }
    }, 1000);
};

const stopTimeSync = () => {
    if (syncInterval.value) {
        clearInterval(syncInterval.value);
        syncInterval.value = null;
    }
};

// Обработчики SSE событий
const handleTimerSync = (event: CustomEvent) => {
    timerStore.syncTimerState(event.detail);
};

// Жизненный цикл компонента
onMounted(() => {
    const duration = gameStore.currentGame?.timeControl?.initialTime;
    if (duration) {
        timerStore.initializeTimer(duration);
        // Запускаем таймер после обратного отсчета
        if (timerStore.status === 'countdown' || timerStore.init) {
            timerStore.startCountdown();
        }
        // Устанавливаем слушатели событий
        window.addEventListener('timer-sync', handleTimerSync as EventListener);
    }
});

onUnmounted(() => {
    window.removeEventListener('timer-sync', handleTimerSync as EventListener);
    stopTimeSync();
});

// Слежение за изменениями
watch(() => timerStore.status, (newStatus) => {
    if (newStatus === 'active') {
        startTimeSync();
    } else {
        stopTimeSync();
    }
});

watch(() => gameStore.currentGame?.currentTurn, (newTurn, oldTurn) => {
    if (newTurn && newTurn !== oldTurn && gameStore.currentGame?.status === 'active') {
        timerStore.updateTimeAfterMove();
    }
});

watch(() => gameStore.currentGame?.status, (newStatus) => {
    if (newStatus === 'completed') {
        stopTimeSync();
        timerStore.resetTimer();
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

.countdown-display {
    @apply p-4;
}
</style>