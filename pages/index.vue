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

let eventSource: EventSource | null = null;

onMounted(async () => {
    if (authStore.isAuthenticated) {
        await userStore.fetchUsersList();
        await userStore.updateUserStatus(true, false);
        setupSSE();
    }
});

onBeforeUnmount(async () => {
    if (authStore.isAuthenticated) {
        await userStore.updateUserStatus(false, false);
    }
    closeSSE();
});

if (import.meta.client) {
    window.addEventListener('beforeunload', async () => {
        if (authStore.isAuthenticated) {
            await userStore.updateUserStatus(false, false);
        }
    });
}

function setupSSE() {
    eventSource = new EventSource('/api/sse/user-status');
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received SSE message:', data);
        if (data.type === 'status_update') {
            userStore.updateUserInList(data.userId, data.isOnline, data.isGame);
        } else if (data.type === 'game_invitation') {
            userStore.handleGameInvitation(data.fromInviteId, data.fromInviteName);
        } else if (data.type === 'game_start') {
            userStore.handleGameStart(data.gameId);
        }
    };
    eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        closeSSE();
        setTimeout(setupSSE, 5000); // Попытка переподключения через 5 секунд
    };
}

function closeSSE() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
}

definePageMeta({
    requiresAuth: true
});
</script>