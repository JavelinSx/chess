<template>
    <form @submit.prevent="handleSubmit">
        <input v-model="username" type="text">
        <input v-model="email" type="email">
        <input v-model="password" type="password">
        <button type="submit">Регистрация</button>
        <span v-if="error">{{ error }}</span>
    </form>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth';
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const error = computed(() => authStore.error)

const handleSubmit = async () => {
    await authStore.register(username.value, email.value, password.value)
}

</script>

<style scoped>
/* Ваши стили здесь */
</style>