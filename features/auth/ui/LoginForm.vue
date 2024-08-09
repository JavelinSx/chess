<template>
    <form class="auth-form" @submit.prevent="handleLogin" novalidate>
        <h2 class="auth-form__title">Login</h2>
        <BaseInput id="email" label="Email" type="email" v-model="email" required @error="handleError"
            class="auth-form__input" />
        <BaseInput id="password" label="Password" type="password" v-model="password" :minLength="4" required
            @error="handleError" class="auth-form__input" />
        <BaseButton server-action @click="handleLogin" class="auth-form__submit">
            Login
        </BaseButton>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';
import BaseInput from '~/shared/ui/BaseInput.vue';
import BaseButton from '~/shared/ui/Button.vue';
const authStore = useAuth()
const email = ref('');
const password = ref('');

const handleError = (error: string) => {
    console.log('Input error:', error);
};

const handleLogin = async () => {
    await authStore.login(email.value, password.value)
    if (authStore.isAuthenticated) {
        navigateTo('/')
    }
}
</script>

<style lang="scss" scoped>
.auth-form {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

    @media (max-width: 480px) {
        padding: 1.5rem;
        margin: 1rem auto;
    }

    &__title {
        font-size: 1.5rem;
        color: #2c3e50;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    &__input {
        margin-bottom: 1rem;
    }

    &__submit {
        width: 100%;
        padding: 0.75rem;
        background-color: #3498db;
        color: #ffffff;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.3s ease;

        &:hover {
            background-color: #2980b9;
        }

        &:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
        }
    }
}
</style>