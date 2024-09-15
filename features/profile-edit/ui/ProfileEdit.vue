<template>
    <UCard class="max-w-2xl mx-auto">
        <template #header>
            <h2 class="text-2xl font-bold">{{ t('editProfile') }}</h2>
        </template>

        <UForm :state="profile" @submit="updateProfile" class="flex flex-col">
            <UFormGroup :label="t('username')" name="username" class="mb-4">
                <UInput v-model="profile.username" type="text" required size="lg" />
            </UFormGroup>

            <UFormGroup :label="t('email')" name="email">
                <UInput v-model="profile.email" type="email" required size="lg" />
            </UFormGroup>

            <UCard class="mt-4">
                <URadioGroup v-model="selectOptionChat" :options="localizedOptionsChat">
                    <template #legend>
                        <p class="mb-2">{{ t('chatPrivacySettings') }}</p>
                    </template>
                    <template #label="{ option }">
                        <div class="mb-2">
                            {{ option.label }}
                        </div>
                    </template>
                </URadioGroup>
            </UCard>
            <UButton type="submit" color="primary" size="lg" class="mt-4 justify-center" :disabled="!isProfileChanged">
                {{ t('updateProfile') }}
            </UButton>
        </UForm>

        <template #footer>
            <ChangePassword />
        </template>
    </UCard>

    <UCard class="max-w-2xl mx-auto mt-8">
        <template #header>
            <h2 class="text-2xl font-bold">{{ t('userStatistics') }}</h2>
        </template>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <h3 class="font-semibold">{{ t('gamesPlayed') }}:</h3>
                <p>{{ user.gamesPlayed }}</p>
            </div>
            <div>
                <h3 class="font-semibold">{{ t('winRate') }}:</h3>
                <p>{{ winRate }}%</p>
            </div>
            <div>
                <h3 class="font-semibold">{{ t('gamesWon') }}:</h3>
                <p class="">{{ user.gamesWon }}</p>
            </div>
            <div>
                <h3 class="font-semibold">{{ t('gamesLost') }}:</h3>
                <p class="">{{ user.gamesLost }}</p>
            </div>
            <div>
                <h3 class="font-semibold">{{ t('gamesDrawn') }}:</h3>
                <p class="">{{ user.gamesDraw }}</p>
            </div>
            <div>
                <h3 class="font-semibold">{{ t('rating') }}:</h3>
                <p class="">{{ user.rating }}</p>
            </div>
        </div>

        <template #footer>
            <h3 class="font-semibold">{{ t('lastLogin') }}:</h3>
            <p class="">{{ formattedLastLogin }}</p>
        </template>

    </UCard>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '~/store/user';
import ChangePassword from './ChangePassword.vue';
import { useAlert } from '~/composables/useAlert';
import type { ClientUser } from '~/server/types/user';
const { t } = useI18n()
const props = defineProps<{
    user: ClientUser
}>();

const localizedOptionsChat = computed(() => [
    {
        value: true,
        label: t('all')
    },
    {
        value: false,
        label: t('onlyFriends')
    }
]);

const { alert, setAlert, clearAlert } = useAlert()

const optionsChat = [
    {
        value: true,
        label: 'All'
    },
    {
        value: false,
        label: 'Only friends'
    }
]

const userStore = useUserStore()

const selectOptionChat = ref(props.user.chatSetting ?? true)

const originalProfile = {
    username: props.user.username || '',
    email: props.user.email || '',
    chatSetting: props.user.chatSetting ?? true
}

const profile = reactive({
    username: originalProfile.username,
    email: originalProfile.email,
})


const isProfileChanged = computed(() => {
    return profile.username !== originalProfile.username ||
        profile.email !== originalProfile.email ||
        selectOptionChat.value !== originalProfile.chatSetting
})

const updateProfile = async () => {
    if (!isProfileChanged.value) {
        setAlert('info', 'No changes to update')
        return
    }

    try {
        await userStore.updateProfile(profile.username, profile.email, selectOptionChat.value)
        setAlert('success', 'Profile updated successfully!')
        Object.assign(originalProfile, { ...profile, chatSetting: selectOptionChat.value })
    } catch (err) {
        setAlert('error', 'Failed to update profile')
        console.error(err)
    }
}

const winRate = computed(() => {
    if (props.user.gamesPlayed === 0) return 0
    return ((props.user.gamesWon / props.user.gamesPlayed) * 100).toFixed(2)
})

const formattedLastLogin = computed(() => {
    if (!props.user.lastLogin) return 'N/A'
    return new Date(props.user.lastLogin).toLocaleString()
})

</script>