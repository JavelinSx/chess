<template>
    <form @submit.prevent="updateProfile">
        <input v-model="username" placeholder="Username" />
        <input v-model="email" placeholder="Email" />
        <button type="submit">Update Profile</button>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '~/store/user';

const userStore = useUserStore();
const username = ref(userStore.username);
const email = ref(userStore.email);

const updateProfile = async () => {
    try {
        if (username.value && email.value)
            await userStore.updateProfile(username.value, email.value);
        // Показать сообщение об успешном обновлении
    } catch (error) {
        // Показать сообщение об ошибке
        console.error('Failed to update profile:', error);
    }
};
</script>