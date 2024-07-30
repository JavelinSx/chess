<template>
    <div>
        <h2>Edit Profile</h2>
        <form @submit.prevent="updateProfile">
            <div>
                <label for="username">Username:</label>
                <input id="username" v-model="profile.username" type="text" required>
            </div>
            <div>
                <label for="email">Email:</label>
                <input id="email" v-model="profile.email" type="email" required>
            </div>
            <!-- Добавьте другие поля профиля по необходимости -->
            <button type="submit">Update Profile</button>
        </form>
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">Profile updated successfully!</p>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '~/store/auth'

const authStore = useAuthStore()
const error = ref('')
const success = ref(false)

const profile = reactive({
    username: authStore.user?.username || '',
    email: authStore.user?.email || '',
    // Добавьте другие поля профиля
})

const updateProfile = async () => {
    try {
        await authStore.updateProfile(profile)
        success.value = true
        error.value = ''
    } catch (err) {
        success.value = false
        error.value = 'Failed to update profile'
        console.error(err)
    }
}
</script>