<template>
    <div>
        <form @submit.prevent="handleSubmit">
            <input v-model="email" type="email">
            <input v-model="password" type="password">
            <button type="submit">Войти</button>
            <span>{{ error }}</span>
        </form>
    </div>


</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth';
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const error = computed(() => authStore.error)

const handleSubmit = async () => {
    await authStore.login(email.value, password.value)
    if (authStore.isAuthenticated) {
        navigateTo('/')
    }
}

</script>

<style scoped>
/* Ваши стили здесь */
</style>