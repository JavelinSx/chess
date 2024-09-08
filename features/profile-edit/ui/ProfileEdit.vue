<template>
    <UCard class="max-w-2xl mx-auto">
        <template #header>
            <h2 class="text-2xl font-bold">Edit Profile</h2>
        </template>

        <UForm :state="profile" @submit="updateProfile">
            <UFormGroup label="Username" name="username" class="mb-4">
                <UInput v-model="profile.username" type="text" required size="lg" />
            </UFormGroup>

            <UFormGroup label="Email" name="email">
                <UInput v-model="profile.email" type="email" required size="lg" />
            </UFormGroup>

            <UButton type="submit" color="primary" class="mt-4">Update Profile</UButton>
        </UForm>
        <ChangePassword />
        <template #footer>
            <UAlert v-if="error" color="red" :title="error" icon="i-heroicons-exclamation-circle" />
            <UAlert v-if="success" color="green" title="Profile updated successfully!"
                icon="i-heroicons-check-circle" />
        </template>
    </UCard>

    <UCard class="max-w-2xl mx-auto mt-8">
        <template #header>
            <h2 class="text-2xl font-bold">User Statistics</h2>
        </template>

        <UDivider class="mb-2" />

        <div class="grid grid-cols-2 gap-4">
            <div>
                <h3 class="font-semibold">Games Played:</h3>
                <p>{{ user.gamesPlayed }}</p>
            </div>
            <div>
                <h3 class="font-semibold">Win Rate:</h3>
                <p>{{ winRate }}%</p>
            </div>
            <div>
                <h3 class="font-semibold">Games Won:</h3>
                <p>{{ user.gamesWon }}</p>
            </div>
            <div>
                <h3 class="font-semibold">Games Lost:</h3>
                <p>{{ user.gamesLost }}</p>
            </div>
            <div>
                <h3 class="font-semibold">Games Drawn:</h3>
                <p>{{ user.gamesDraw }}</p>
            </div>
            <div>
                <h3 class="font-semibold">Rating:</h3>
                <p>{{ user.rating }}</p>
            </div>
        </div>

        <UDivider class="mb-2 mt-2" />

        <div>
            <h3 class="font-semibold">Last Login:</h3>
            <p>{{ formattedLastLogin }}</p>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '~/store/user';
import ChangePassword from './ChangePassword.vue';
import type { ClientUser } from '~/server/types/user';

const props = defineProps<{
    user: ClientUser
}>();

const userStore = useUserStore()
const error = ref('')
const success = ref(false)

const profile = reactive({
    username: props.user.username || '',
    email: props.user.email || '',
})

const updateProfile = async () => {
    try {
        await userStore.updateProfile(profile.username, profile.email)
        success.value = true
        error.value = ''
    } catch (err) {
        success.value = false
        error.value = 'Failed to update profile'
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