<template>
    <form @submit.prevent="handleSubmit" class="chess-form">
        <input v-model="email" type="email" placeholder="Email" required>
        <input v-model="password" type="password" placeholder="Password" required>
        <button type="submit">Войти</button>
        <p v-if="userStore.error" class="error-message">{{ userStore.error }}</p>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '~/stores/user/userStore'
import { navigateTo } from 'nuxt/app'

const userStore = useUserStore()

const email = ref('')
const password = ref('')

const handleSubmit = async () => {
    try {
        await userStore.login(email.value, password.value)
        navigateTo('/chess')
    } catch (error) {
        // Ошибка уже обработана в store
    }
}
</script>
<style lang="scss" scoped>
.chess-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    div {
        position: relative;
    }

    label {
        position: absolute;
        left: 1rem;
        top: 0.5rem;
        color: #888;
        transition: all 0.3s ease;
    }

    input {
        width: 100%;
        padding: 0.8rem 1rem;
        border: 2px solid #d9d9d9;
        border-radius: 4px;
        font-size: 1rem;
        transition: all 0.3s ease;

        &:focus {
            border-color: #4a4a4a;
            outline: none;
        }

        &:focus+label,
        &:not(:placeholder-shown)+label {
            top: -0.5rem;
            left: 0.5rem;
            font-size: 0.8rem;
            background-color: white;
            padding: 0 0.3rem;
        }
    }

    button {
        padding: 0.8rem 1rem;
        background-color: #4a4a4a;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.3s ease;

        &:hover {
            background-color: #333;
        }
    }
}
</style>