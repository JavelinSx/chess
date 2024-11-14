<template>
    <UCard class="max-w-2xl mx-auto">
        <template #header>
            <h2 class="text-2xl font-bold">{{ t('profile.editProfile') }}</h2>
        </template>

        <UForm :state="profile" @submit="updateProfile" class="flex flex-col">

            <UFormGroup class="mb-4" ame="avatar">
                <div class="flex items-center space-x-4">
                    <UAvatar :src="user.avatar" :alt="user.username" size="xl" />
                    <UButton color="gray" variant="soft" @click="triggerFileInput">
                        {{ t('profile.changeAvatar') }}
                    </UButton>
                    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
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

        <template #footer>
            <ChangePassword />
        </template>
    </UCard>

    <UCard class="max-w-2xl mx-auto mt-8">
        <template #header>
            <h2 class="text-2xl font-bold">{{ t('profile.userStatistics') }}</h2>
        </template>

        <RatingTitle :rating="user.rating" class="mb-6" />

        <UTable :columns="columns" :rows="rows" />

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
const fileInput = ref<HTMLInputElement | null>(null);
const avatarPreview = ref<string | null>(null);

const chatSettingOptions = computed(() => [
    { value: 'all', label: t('chat.all') },
    { value: 'friends_only', label: t('chat.onlyFriends') },
    { value: 'nobody', label: t('chat.nobody') }
]);

const profile = reactive({
    username: props.user.username,
    email: props.user.email || '',
    chatSetting: props.user.chatSetting,
    avatarFile: null as File | null
})

const isProfileChanged = computed(() => {
    return profile.username !== props.user.username ||
        profile.email !== props.user.email ||
        profile.chatSetting !== props.user.chatSetting ||
        profile.avatarFile?.name !== props.user.avatar
})

const triggerFileInput = () => {
    fileInput.value?.click();
}

const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        profile.avatarFile = file;

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarPreview.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
}

const updateProfile = async () => {
    if (!isProfileChanged.value) {
        setAlert('info', 'No changes to update')
        return
    }

    try {
        await userStore.updateProfile(profile.username, profile.email, profile.chatSetting)
        setAlert('success', 'Profile updated successfully!')
    } catch (err) {
        setAlert('error', 'Failed to update profile')
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