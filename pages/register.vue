<template>
    <form @submit="handlerSubmit">
        <input v-model="email" type="email" label="email">
        <input v-model="password" type="password" label="password">
        <button type="submit">Регистрация</button>
        <span>{{ error }}</span>
    </form>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth';

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
// Ваш код TypeScript здесь
const handlerSubmit = async () => {

    try {
        await authStore.register(email.value, password.value)
        navigateTo('/')
    } catch (err) {
        if (err instanceof Error) {
            error.value = err.message
        } else {
            error.value = 'An unexpected error occurred'
        }
    }

}
</script>

<style scoped>
/* Ваши стили здесь */
</style>