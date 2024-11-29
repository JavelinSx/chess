    <template>

        <UCard :ui="{
            base: 'max-w-2xl w-full',
            header: {
                padding: 'px-4 py-5 sm:px-4 md:px-4'
            },
            body: {
                padding: 'px-4 py-5 sm:px-2 md:px-4'
            },
            footer: {
                padding: 'px-4 py-5 sm:px-2 md:px-4'
            }
        }">
            <template #header>
                <h2 class="text-2xl sm:text-lg font-bold">{{ t('profile.profile') }}</h2>
            </template>

            <div class="flex items-center mb-4">
                <UAvatar :ui="{
                    rounded: 'object-cover'
                }" :src="getUserAvatar()" :alt="user.username" size="xl" class="mr-4" />
                <div class="flex flex-col gap-4 ml-2 sm:text-sm">
                    <div>
                        <p class="font-semibold">{{ t('auth.email') }}:</p>
                        <p>{{ user.email }}</p>
                    </div>
                    <div>
                        <p class="font-semibold">{{ t('auth.username') }}:</p>
                        <h3 class="text-xl sm:text-sm font-semibold ">{{ user.username }}</h3>
                    </div>
                </div>
            </div>
        </UCard>

        <UCard :ui="{
            header: {
                padding: 'px-4 py-5 sm:px-4 md:px-4'
            },
            body: {
                padding: 'px-4 py-5 sm:px-2 md:px-4'
            },
            footer: {
                padding: 'px-4 py-5 sm:px-2 md:px-4'
            }
        }" class="max-w-2xl w-full ">
            <template #header>
                <h2 class="text-2xl sm:text-lg font-bold">{{ t('profile.userStatistics') }}</h2>
            </template>

            <RatingTitle :rating="user.rating" class="mb-6" />

            <UTable :columns="columns" :rows="rows" />
            <template #footer>
                <p class="text-sm text-gray-500">{{ t('profile.lastLogin') }}: {{ formattedLastLogin }}</p>
            </template>
        </UCard>

    </template>

<script setup lang="ts">
import { computed } from 'vue';
import RatingTitle from './RatingTitle.vue';
import type { ClientUser } from '~/server/types/user';

const props = defineProps<{
    user: ClientUser
}>();

const { t } = useI18n();

const columns = [
    { key: 'stat', label: t('profile.statistic') },
    { key: 'value', label: t('profile.value') },
];

const rows = computed(() => [
    { stat: t('profile.gamesPlayed'), value: props.user.stats.gamesPlayed },
    { stat: t('profile.gamesWon'), value: props.user.stats.gamesWon },
    { stat: t('profile.gamesLost'), value: props.user.stats.gamesLost },
    { stat: t('profile.gamesDraw'), value: props.user.stats.gamesDraw },
    { stat: t('profile.winRate'), value: `${winRate.value}%` },
    { stat: t('profile.capturedPawns'), value: props.user.stats.capturedPawns },
    { stat: t('profile.checksGiven'), value: props.user.stats.checksGiven },
    { stat: t('profile.castlingsMade'), value: props.user.stats.castlingsMade },
    { stat: t('profile.promotions'), value: props.user.stats.promotions },
    { stat: t('profile.enPassantCaptures'), value: props.user.stats.enPassantCaptures },
    { stat: t('profile.queenSacrifices'), value: props.user.stats.queenSacrifices },
    { stat: t('profile.averageMovesPerGame'), value: props.user.stats.averageMovesPerGame.toFixed(2) },
    { stat: t('profile.longestGame'), value: props.user.stats.longestGame },
    { stat: t('profile.shortestWin'), value: props.user.stats.shortestWin },
    { stat: t('profile.averageRatingChange'), value: props.user.stats.averageRatingChange.toFixed(2) },
    { stat: t('profile.winStreakBest'), value: props.user.stats.winStreakBest },
    { stat: t('profile.currentWinStreak'), value: props.user.stats.currentWinStreak },
    { stat: t('profile.resignations'), value: props.user.stats.resignations },
]);

const winRate = computed(() => {
    if (props.user.stats.gamesPlayed === 0) return 0;
    return ((props.user.stats.gamesWon / props.user.stats.gamesPlayed) * 100).toFixed(2);
});

const formattedLastLogin = computed(() => {
    if (!props.user.lastLogin) return 'N/A';
    return new Date(props.user.lastLogin).toLocaleString();
});

function getUserAvatar() {
    return props.user.avatar;
}

</script>