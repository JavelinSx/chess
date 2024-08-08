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
const intervalId = ref<number | null>(null);

const setupUserListInterval = () => {
    intervalId.value = setInterval(() => userStore.fetchUsersList(), 30000) as unknown as number;
};

onMounted(async () => {
    if (authStore.isAuthenticated) {

        await userStore.fetchUsersList();
        await userStore.updateUserStatus(true, false);
        setupUserListInterval();
    }
});

onUnmounted(() => {
    if (authStore.isAuthenticated) {
        if (intervalId.value !== null) {
            clearInterval(intervalId.value);
        }
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