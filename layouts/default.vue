<template>
    <div>
        <header>
            <nav>
                <NuxtLink to="/">Home</NuxtLink>
                <NuxtLink v-if="authStore.isAuthenticated" to="/profile">Profile</NuxtLink>
                <a v-if="authStore.isAuthenticated" href="#" @click.prevent="logout">Logout</a>
                <NuxtLink v-else to="/login">Login</NuxtLink>
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
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const logout = () => {
    authStore.logout()
    router.push('/')
}
</script>