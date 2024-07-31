<!-- pages/index.vue -->
<template>
    <div>
        <h1>Welcome to Chess Game</h1>
        <p v-if="isAuthenticated">
            Hello, {{ user?.username }}!
        </p>
        <p v-else>
            <NuxtLink to="/login">Login</NuxtLink> or
            <NuxtLink to="/register">Register</NuxtLink> to start playing.
        </p>

        <UserList v-if="isAuthenticated" />
        <GameInvitationModal v-if="userStore.currentInvitation" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useUserStore } from '~/store/user';
import { useAuthStore } from '~/store/auth';
import UserList from '~/features/user-list/UserList.vue';
import GameInvitationModal from '~/features/invite-modal/GameInvitationModal.vue';

const userStore = useUserStore();
const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => userStore.user);

onMounted(async () => {
    if (authStore.isAuthenticated) {
        await userStore.fetchUsersList();
        await userStore.updateUserStatus(true, false);
        // Добавьте периодическое обновление списка пользователей
        const intervalId = setInterval(() => userStore.fetchUsersList(), 30000); // каждые 30 секунд
        onUnmounted(() => clearInterval(intervalId));
    }
});

onBeforeUnmount(async () => {
    if (authStore.isAuthenticated) {
        await userStore.updateUserStatus(false, false);
    }
});

if (import.meta.client) {
    window.addEventListener('beforeunload', async () => {
        if (authStore.isAuthenticated) {
            await userStore.updateUserStatus(false, false);
        }
    });
}

definePageMeta({
    requiresAuth: true
});
</script>