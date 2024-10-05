<template>
    <UCard class="max-w-2xl mx-auto">
        <template #header>
            <h2 class="text-2xl font-bold">{{ t('profile.editProfile') }}</h2>
        </template>

        <UForm :state="profile" @submit="updateProfile" class="flex flex-col">
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

        <div class="grid grid-cols-2 gap-4">
            <div>
                <h3 class="font-semibold">{{ t('profile.gamesPlayed') }}:</h3>
                <p>{{ userStore.user?.stats.gamesPlayed }}</p>
            </div>
            <div>
                <h3 class="font-semibold">{{ t('profile.winRate') }}:</h3>
                <p>{{ winRate }}%</p>
            </div>
            <div>
                <h3 class="font-semibold">{{ t('profile.gamesWon') }}:</h3>
                <p class="">{{ userStore.user?.stats.gamesWon }}</p>
            </div>
            <div>
                <h3 class="font-semibold">{{ t('profile.gamesLost') }}:</h3>
                <p class="">{{ userStore.user?.stats.gamesLost }}</p>
            </div>
            <div>
                <h3 class="font-semibold">{{ t('profile.gamesDrawn') }}:</h3>
                <p class="">{{ userStore.user?.stats.gamesDraw }}</p>
            </div>
            <div>
                <h3 class="font-semibold">{{ t('profile.rating') }}:</h3>
                <p class="">{{ userStore.user?.rating }}</p>
            </div>
        </div>

        <template #footer>
            <h3 class="font-semibold">{{ t('profile.lastLogin') }}:</h3>
            <p class="">{{ formattedLastLogin }}</p>
        </template>
        <DeleteAccount />
    </UCard>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '~/store/user';
import ChangePassword from './ChangePassword.vue';
import DeleteAccount from './DeleteAccount.vue';
import { useAlert } from '~/composables/useAlert';
import type { ChatSetting } from '~/server/types/user';
import type { ClientUser } from '~/server/types/user';

const props = defineProps<{
    user: any
}>();

const { t } = useI18n()
const userStore = useUserStore();
const { alert, setAlert, clearAlert } = useAlert()

const chatSettingOptions = computed(() => [
    { value: 'all', label: t('chat.all') },
    { value: 'friends_only', label: t('chat.onlyFriends') },
    { value: 'nobody', label: t('chat.nobody') }
]);

const originalProfile = {
    username: userStore.user?.username || '',
    email: userStore.user?.email || '',
    chatSetting: userStore.user?.chatSetting || 'all' as ChatSetting
}

const profile = reactive({
    username: originalProfile.username,
    email: originalProfile.email,
    chatSetting: originalProfile.chatSetting
})

const isProfileChanged = computed(() => {
    return profile.username !== originalProfile.username ||
        profile.email !== originalProfile.email ||
        profile.chatSetting !== originalProfile.chatSetting
})

const updateProfile = async () => {
    if (!isProfileChanged.value) {
        setAlert('info', 'No changes to update')
        return
    }

    try {
        await userStore.updateProfile(profile.username, profile.email, profile.chatSetting)
        setAlert('success', 'Profile updated successfully!')
        Object.assign(originalProfile, { ...profile })
    } catch (err) {
        setAlert('error', 'Failed to update profile')
        console.error(err)
    }
}

const winRate = computed(() => {
    if (userStore.user?.stats.gamesPlayed === 0) return 0
    return ((userStore.user?.stats.gamesWon! / userStore.user?.stats.gamesPlayed!) * 100).toFixed(2)
})

const formattedLastLogin = computed(() => {
    if (!userStore.user?.lastLogin) return 'N/A'
    return new Date(userStore.user?.lastLogin).toLocaleString()
})


</script>