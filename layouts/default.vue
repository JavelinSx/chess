<template>
    <div>
        <header>
            <nav>

                <NuxtLink to="/">Home</NuxtLink>
                <NuxtLink v-if="isAuthenticated" to="/profile">Profile</NuxtLink>
                <button v-if="isAuthenticated" @click.prevent="logout">Logout</button>
                <NuxtLink v-else to="/login">Login</NuxtLink>
                <NuxtLink v-else to="/register">Register</NuxtLink>


            </nav>
        </header>

        <main>
            <slot />
        </main>

        <footer>
            <!-- Footer content -->
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