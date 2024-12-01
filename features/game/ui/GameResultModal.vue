<template>
    <UModal v-model="showResultModal" @close="onClose">
        <div v-if="gameResult" class="p-4">
            <h2 class="text-xl font-bold mb-4">{{ getResultTitle(gameResult.reason!) }}</h2>
            <p class="mb-2">{{ t('game.winner') }}: {{
                userStore.getUserInUserList(gameResult.winner!)?.username || t('game.draw')
                }}</p>
            <p class="mb-4">{{ t('game.loser') }}: {{
                userStore.getUserInUserList(gameResult.loser!)?.username || t('common.nobody')
                }}</p>
            <div v-if="gameResult.ratingChanges" class="mb-4">
                <h3 class="text-lg font-semibold mb-2">{{ t('game.ratingChanges') }}</h3>
                <p v-for="(change, playerId) in gameResult.ratingChanges" :key="playerId"
                    :class="change >= 0 ? 'text-green-500' : 'text-red-500'">
                    {{ getPlayerName(playerId) }}: {{ change >= 0 ? '+' : ' ' }}{{ change }}
                </p>
            </div>
            <p class="text-sm text-gray-500 mb-4">{{ t('game.closingIn', { seconds: countdown }) }}</p>
            <UButton @click="onClose" color="primary">{{ t('game.close') }}</UButton>
        </div>
    </UModal>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '~/store/game';
import { useUserStore } from '~/store/user';

const gameStore = useGameStore();
const userStore = useUserStore();
const { t } = useI18n();

const countdown = ref(10);
const timer = ref<NodeJS.Timeout | null>(null);

const { gameResult } = storeToRefs(gameStore)
const { showResultModal } = storeToRefs(gameStore)

const getResultTitle = (reason: string) => {
    return t(`gameResult.${reason}`, t('game.gameOver'));
};

const getPlayerName = (playerId: string | number | null) => {
    if (playerId === null) return t('game.draw');
    const id = typeof playerId === 'number' ? playerId.toString() : playerId;
    return userStore.getUserInUserList(id)?.username || t('common.unknownPlayer');
};

const onClose = () => {
    gameStore.closeGameResult();
    navigateTo('/')
};

const startCountdown = () => {
    countdown.value = 10;
    if (timer.value) clearInterval(timer.value);
    timer.value = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            onClose();
        }
    }, 1000);
};

watch(showResultModal, (newValue) => {
    if (newValue) {
        startCountdown();
    } else if (timer.value) {
        clearInterval(timer.value);
    }
});

onMounted(() => {
    if (showResultModal.value) {
        startCountdown();
    }
});

onUnmounted(() => {
    if (timer.value) clearInterval(timer.value);
});
</script>
