<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
import { useUserSSE } from '~/composables/useUserSSE';
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';
import { watch } from 'vue';

const authStore = useAuthStore();
const userStore = useUserStore();

const { closeSSE } = useUserSSE();

watch(() => authStore.isAuthenticated, (newValue) => {
    if (!newValue) {
        closeSSE();
    }
});

watch(() => userStore.user?.isOnline, (newValue) => {
    if (!newValue) {
        closeSSE();
    }
});
</script>

<style>
/* Здесь могут быть глобальные стили */
</style>