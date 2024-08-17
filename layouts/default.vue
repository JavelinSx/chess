<template>
    <div class="min-h-screen flex flex-col">
        <UContainer>
            <nav class="py-4 flex items-center justify-between">
                <NuxtLink to="/" class="text-base font-bold mr-4 sm:text-lg">Chess App</NuxtLink>
                <div class="flex items-center space-x-4">
                    <UButton v-for="link in navLinks" :key="link.to" :to="link.to" color="gray" variant="ghost">
                        {{ link.label }}
                    </UButton>
                    <UButton v-if="isAuthenticated" @click="logout" color="gray" variant="ghost">
                        Logout
                    </UButton>
                </div>
            </nav>
        </UContainer>

        <main class="flex-grow">
            <UContainer class="py-8">
                <slot />
            </UContainer>
        </main>

        <footer class="py-4 mt-auto">
            <UContainer class="text-center text-gray-600">
                <p>&copy; {{ new Date().getFullYear() }} Chess App. All rights reserved.</p>
            </UContainer>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../store/auth';
import { useUserStore } from '~/store/user';

const authStore = useAuthStore();
const userStore = useUserStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);

const navLinks = computed(() => [
    { label: 'Home', to: '/' },
    ...(isAuthenticated.value
        ? [{ label: 'Profile', to: `/profile/${userStore.user?._id}` }]
        : [
            { label: 'Login', to: '/login' },
            { label: 'Register', to: '/register' },
        ]),
]);

const logout = async () => {
    await userStore.updateUserStatus(false, false);
    await authStore.logout();
};
</script>