<template>
    <form class="auth-form">
        <h2 class="auth-form__title">Register</h2>
        <BaseInput id="username" label="Username" v-model="username" placeholder="Enter your username" required
            @error="handleError" class="auth-form__input" />
        <BaseInput id="email" label="Email" type="email" v-model="email" placeholder="Enter your email" required
            @error="handleError" class="auth-form__input" />
        <BaseInput id="password" label="Password" type="password" v-model="password" placeholder="Enter your password"
            :minLength="8" required @error="handleError" class="auth-form__input" />
        <BaseButton server-action @click="handleRegister" class="auth-form__submit">
            Register
        </BaseButton>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';
import BaseInput from '~/shared/ui/BaseInput.vue';
import BaseButton from '~/shared/ui/Button.vue';

const username = ref('');
const email = ref('');
const password = ref('');
const { register } = useAuth();

const handleError = (error: string) => {
    console.log('Input error:', error);
};

const handleRegister = async () => {
    try {
        await register(username.value, email.value, password.value);
        navigateTo('/login');
    } catch (error) {
        console.error('Registration error:', error);
    }
};
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
        background-color: #27ae60;
        color: #ffffff;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.3s ease;

        &:hover {
            background-color: #219653;
        }

        &:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(39, 174, 96, 0.5);
        }
    }
}
</style>