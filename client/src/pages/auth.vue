<template>
    <div class="auth-page">
        <div class="auth-container">
            <h1 class="auth-title">{{ isLogin ? 'Войти' : 'Создать аккаунт' }}</h1>
            <LoginForm v-if="isLogin" />
            <RegisterForm v-else />
            <p class="auth-toggle">
                {{ isLogin ? "У вас нет аккаунта?" : "У вас уже есть аккаунт?" }}
                <a href="#" @click.prevent="toggleForm">
                    {{ isLogin ? 'Register' : 'Login' }}
                </a>
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user/userStore'
import LoginForm from '~/features/auth/ui/LoginForm.vue'
import RegisterForm from '~/features/auth/ui/RegisterForm.vue'

const router = useRouter()
const userStore = useUserStore()
const isLogin = ref(true)

const toggleForm = () => {
    isLogin.value = !isLogin.value
}

// Redirect if user is already authenticated
if (userStore.isAuthenticated) {
    router.push('/')
}
</script>
<style lang="scss" scoped>
.auth-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: repeating-conic-gradient(#d9d9d9 0% 25%, #ffffff 0% 50%) 50% / 50px 50px;

    .auth-container {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
    }

    .auth-title {
        color: #333;
        text-align: center;
        margin-bottom: 1.5rem;
        font-size: 2rem;
    }

    .auth-toggle {
        text-align: center;
        margin-top: 1rem;

        a {
            color: #4a4a4a;
            text-decoration: underline;
        }
    }
}
</style>