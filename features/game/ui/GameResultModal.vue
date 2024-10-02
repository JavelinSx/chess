<template>
    <UModal v-model="showResultModal" @close="onClose">
        <div v-if="gameStore.gameResult" class="p-4">
            <h2 class="text-xl font-bold mb-4">{{ getResultTitle(gameStore.gameResult.reason!) }}</h2>
            <p class="mb-2">{{ t('game.winner') }}: {{
                userStore.getUserInUserList(gameStore.gameResult.winner!)?.username || t('game.draw') }}</p>
            <p class="mb-4">{{ t('game.loser') }}: {{ userStore.getUserInUserList(gameStore.gameResult.loser!)?.username
                || t('common.nobody') }}</p>
            <p class="text-sm text-gray-500 mb-4">{{ t('game.closingIn', { seconds: countdown }) }}</p>
            <UButton @click="onClose" color="primary">{{ t('game.close') }}</UButton>
        </div>
    </UModal>
</template>

<script setup lang="ts">
import { useGameStore } from '~/store/game';
import { useUserStore } from '~/store/user';
import { storeToRefs } from 'pinia';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const gameStore = useGameStore();
const userStore = useUserStore()
const { showResultModal } = storeToRefs(gameStore);
const router = useRouter();

const countdown = ref(10);
let timer: NodeJS.Timeout | null = null;

const onClose = () => {
    gameStore.closeGameResult();
    router.push('/');
};

const startTimer = () => {
    timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            onClose();
        }
    }, 1000);
};

const stopTimer = () => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
};

const getResultTitle = (reason: string) => {
    return t(`gameResult.${reason}`, t('game.gameOver'));
};

watch(showResultModal, (newValue) => {
    if (newValue) {
        countdown.value = 10;
        startTimer();
    } else {
        stopTimer();
    }
});

onMounted(() => {
    if (showResultModal.value) {
        startTimer();
    }
});

onUnmounted(() => {
    stopTimer();
});
</script>