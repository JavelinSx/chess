<template>
    <UCard :ui="{
        header: {
            base: 'px-4 py-5 sm:px-4 md:px-4'
        },
        body: {
            base: 'px-4 py-5 sm:px-2 md:px-4'
        },
        footer: {
            base: 'px-4 py-5 sm:px-2 md:px-4'
        }
    }">
        <template #header>
            <h2 class="text-2xl sm:text-xl font-bold">{{ t('profile.editProfile') }}</h2>
        </template>

        <UForm :state="profile" @submit="updateProfile" class="flex flex-col">

            <UFormGroup class="mb-4" name="avatar">
                <div class="flex items-center space-x-4">
                    <UAvatar :ui="{
                        wrapper: 'object-contain'
                    }" :src="user.avatar" :alt="user.username" size="xl" />
                    <template v-if="showAvatarInput"> <!-- Используем template вместо div -->
                        <UInput v-model="profile.avatarUrl" type="url" placeholder="Enter avatar URL" class="flex-1" />
                    </template>
                    <UButton v-else color="gray" variant="soft" @click="showAvatarInput = true">
                        {{ t('profile.changeAvatar') }}
                    </UButton>
                </div>
            </UFormGroup>

            <UFormGroup :label="t('auth.username')" name="username" class="mb-4">
                <UInput v-model="profile.username" type="text" required size="lg" />
            </UFormGroup>

            <UFormGroup :label="t('auth.email')" name="email">
                <UInput v-model="profile.email" type="email" required size="lg" />
            </UFormGroup>

            <UCard class="mt-4">
                <URadioGroup v-model="profile.chatSetting" :options="chatSettingOptions">
                    <template #legend>
                        <p class="mb-2">{{ t('chat.chatPrivacySettings') }}</p>
                    </template>
                    <template #label="{ option }">
                        <div class="mb-2">
                            {{ option.label }}
                        </div>
                    </template>
                </URadioGroup>
            </UCard>
            <UButton type="submit" color="primary" size="lg" class="mt-4 justify-center" :disabled="!isProfileChanged">
                {{ t('profile.updateProfile') }}
            </UButton>
        </UForm>

        <template v-if="changePasswordNeed" #footer>
            <ChangePassword />
        </template>
        <UAlert v-if="alert.type === 'error'" title="Ошибка" :description="alert.message" variant="soft"
            :color="alert.type === 'error' ? 'red' : 'green'">
        </UAlert>
    </UCard>

    <UCard class="max-w-2xl mx-auto mt-8">
        <template #header>
            <h2 class="text-2xl sm:text-xl font-bold">{{ t('profile.userStatistics') }}</h2>
        </template>

        <RatingTitle :rating="user.rating" class="mb-6" />

        <!-- Desktop view -->
        <UTable :columns="columns" :rows="rows" class="hidden md:table w-full" />

        <!-- Mobile view -->
        <div class="md:hidden">
            <div v-for="row in rows" :key="row.stat" class="border-b py-3">
                <div class="font-medium text-sm pr-2">{{ row.stat }}</div>
                <div class="text-right text-sm">{{ row.value }}</div>
            </div>
        </div>

        <template #footer>

            <DeleteAccount />
            <h3 class="font-semibold mt-4 text-center">{{ t('profile.lastLogin') }}: {{ formattedLastLogin }}</h3>
        </template>
    </UCard>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '~/store/user';
import ChangePassword from './ChangePassword.vue';
import DeleteAccount from './DeleteAccount.vue';
import RatingTitle from './RatingTitle.vue';
import { useAlert } from '~/composables/useAlert';
import type { ChatSetting } from '~/server/types/user';
import type { ClientUser } from '~/server/types/user';

const props = defineProps<{
    user: ClientUser
}>();

const { t } = useI18n()
const userStore = useUserStore();
const { alert, setAlert, clearAlert } = useAlert()
const changePasswordNeed = computed(() => !props.user.githubId && !props.user.vkId && !props.user.googleId)
const showAvatarInput = ref(false)
const chatSettingOptions = computed(() => [
    { value: 'all', label: t('chat.all') },
    { value: 'friends_only', label: t('chat.onlyFriends') },
    { value: 'nobody', label: t('chat.nobody') }
]);

const profile = reactive({
    username: props.user.username,
    email: props.user.email || '',
    chatSetting: props.user.chatSetting,
    avatarUrl: props.user.avatar || ''
})

const isProfileChanged = computed(() => {
    return profile.username !== props.user.username ||
        profile.email !== props.user.email ||
        profile.chatSetting !== props.user.chatSetting ||
        profile.avatarUrl !== props.user.avatar
})

const updateProfile = async () => {
    if (!isProfileChanged.value) {
        setAlert('info', 'No changes to update')
        return
    }
    try {
        await userStore.updateProfile(profile.username, profile.email, profile.chatSetting, profile.avatarUrl)
        setAlert('success', 'Profile updated successfully!')
        showAvatarInput.value = false
    } catch (err) {
        setAlert('error', 'Failed to update profile')
    } finally {
        clearAlert()
    }
}

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
    if (props.user.stats.gamesPlayed === 0) return 0
    return ((props.user.stats.gamesWon / props.user.stats.gamesPlayed) * 100).toFixed(2)
})

const formattedLastLogin = computed(() => {
    if (!props.user.lastLogin) return 'N/A'
    return new Date(props.user.lastLogin).toLocaleString()
})
</script>

<style scoped>
/* Дополнительные стили для мобильной версии */
.sm\:hidden {
    @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.border-b {
    @apply px-4 flex justify-between items-center;
}

/* Для текста значений */
.text-right {
    @apply font-semibold;
}
</style>