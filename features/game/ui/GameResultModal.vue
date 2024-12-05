<template>

    <UModal v-model="showResultModal" @close="onClose">
        <div v-if="gameResult" class="p-4">
            <UCard>
                <template #header>
                    <h2 class="text-xl font-bold mb-4">{{ getResultTitle(gameResult.reason!) }}</h2>

                    <UCard class="mb-4">
                        <div class="flex items-center gap-4">
                            <UAvatar :src="gameResult.winner.avatar" :alt="gameResult.winner.username" size="lg" />
                            <div class="flex-grow">
                                <h3 class="font-semibold">{{ t('game.winner') }}</h3>
                                <p>{{ gameResult.winner.username }}</p>
                                <p v-if="gameResult.ratingChanges" class="text-green-500 font-medium">
                                    {{ gameResult.ratingChanges[gameResult.winner._id] >= 0 ? '+' : '' }}
                                    {{ gameResult.ratingChanges[gameResult.winner._id] }}
                                </p>
                            </div>
                        </div>
                    </UCard>

                    <UCard>
                        <div class="flex items-center gap-4">
                            <UAvatar :src="gameResult.loser.avatar" :alt="gameResult.loser.username" size="lg" />
                            <div class="flex-grow">
                                <h3 class="font-semibold">{{ t('game.loser') }}</h3>
                                <p>{{ gameResult.loser.username }}</p>
                                <p v-if="gameResult.ratingChanges" class="text-red-500 font-medium">
                                    {{ gameResult.ratingChanges[gameResult.loser._id] >= 0 ? '+' : '' }}
                                    {{ gameResult.ratingChanges[gameResult.loser._id] }}
                                </p>
                            </div>
                        </div>
                    </UCard>
                </template>
                <RatingTitle :rating="animatedRating" />
            </UCard>
            <p class="text-sm text-gray-500 mb-4">{{ t('game.closingIn', { seconds: countdown }) }}</p>
            <UButton @click="onClose" color="primary">{{ t('game.close') }}</UButton>
        </div>
    </UModal>

</template>

<script setup lang="ts">
import { useGameStore } from '~/stores/game';
import { useUserStore } from '~/stores/user';
import RatingTitle from '~/features/profile/ui/RatingTitle.vue';
const { t } = useI18n();
const gameStore = useGameStore();
const userStore = useUserStore();
const { gameResult } = storeToRefs(gameStore);
const { showResultModal } = storeToRefs(gameStore);

const countdown = ref(10);
const timer = ref<NodeJS.Timeout | null>(null);
const animatedRating = ref(userStore.user?.rating!);


onMounted(() => {
    if (showResultModal.value && gameStore.currentGame) {
        startCountdown();

        // Определяем цвет игрока
        const playerColor = gameStore.currentGame.players.white._id === userStore.user?._id ? 'white' : 'black';
        const otherColor = playerColor === 'white' ? 'black' : 'white';

        // Берем рейтинги из состояния игры
        const initialRating = gameStore.currentGame.players[playerColor].rating;
        const ratingChange = gameResult.value?.ratingChanges?.[userStore.user?._id!] || 0;

        // Устанавливаем начальное значение равным начальному рейтингу
        animatedRating.value = initialRating;

        // Устанавливаем конечное значение
        setTimeout(() => {
            animatedRating.value = initialRating + ratingChange;
        }, 1000);
    }
});

const getResultTitle = (reason: string) => {
    return t(`gameResult.${reason}`, t('game.gameOver'));
};

const onClose = () => {
    gameStore.closeGameResult();
    navigateTo('/');
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

onUnmounted(() => {
    if (timer.value) clearInterval(timer.value);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>