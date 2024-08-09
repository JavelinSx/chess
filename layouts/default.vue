<template>
    <div class="layout">
        <header class="header">
            <nav class="nav">
                <NuxtLink to="/" class="nav-link">Home</NuxtLink>
                <NuxtLink v-if="isAuthenticated" to="/profile" class="nav-link">Profile</NuxtLink>
                <button v-if="isAuthenticated" @click.prevent="logout" class="nav-button">Logout</button>
                <NuxtLink v-else to="/login" class="nav-link">Login</NuxtLink>
                <NuxtLink v-else to="/register" class="nav-link">Register</NuxtLink>
            </nav>
        </header>

        <main class="main">
            <slot />
        </main>

        <footer class="footer">
            <!-- Footer content -->
            <p>&copy; 2023 Your Chess App. All rights reserved.</p>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../store/auth';
import { useUserStore } from '~/store/user';
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const userStore = useUserStore()
const router = useRouter()

const isAuthenticated = computed(() => authStore.isAuthenticated);

const logout = async () => {
    await userStore.updateUserStatus(false, false);
    await authStore.logout();
};
</script>

<style lang="scss" scoped>
.layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.header {
    background-color: #2c3e50;
    padding: 1rem;

    .nav {
        display: flex;
        justify-content: center;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;

        @media (max-width: 768px) {
            flex-direction: column;
            align-items: flex-start;
        }

        .nav-link,
        .nav-button {
            color: #ecf0f1;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            transition: background-color 0.3s ease;

            &:hover {
                background-color: #34495e;
            }

            @media (max-width: 768px) {
                margin-bottom: 0.5rem;
            }
        }

        .nav-button {
            background-color: transparent;
            border: 1px solid #ecf0f1;
            cursor: pointer;
            font-size: 1rem;

            &:hover {
                background-color: #ecf0f1;
                color: #2c3e50;
            }
        }
    }
}

.main {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;

    @media (max-width: 768px) {
        padding: 1rem;
    }
}

.footer {
    background-color: #34495e;
    color: #ecf0f1;
    text-align: center;
    padding: 1rem;
    margin-top: auto;
}
</style>