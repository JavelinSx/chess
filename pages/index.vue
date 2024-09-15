<!-- pages/index.vue -->
<template>
    <div class="flex flex-col items-center justify-center gap-4">
        <h1>{{ t('welcome') }}</h1>
        <p v-if="isAuthenticated">
            {{ t('hello') }} {{ user?.username }}!
        </p>
        <p v-else>
            <NuxtLink to="/login">{{ t('login') }}</NuxtLink> {{ t('or') }}
            <NuxtLink to="/register">{{ t('register') }}</NuxtLink> {{ t('startPlaying') }}.
        </p>

        <UserList v-if="isAuthenticated" />
        <GameInvitationModal v-if="invitationStore.currentInvitation" />
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
import { onMounted } from 'vue';
import { useChatSSE } from '#imports';
import { useUserStore } from '~/store/user';
import { useAuthStore } from '~/store/auth';
import { useInvitationStore } from '~/store/invitation';
import UserList from '~/features/user-list/UserList.vue';
import GameInvitationModal from '~/features/invite-modal/GameInvitationModal.vue';
useChatSSE()
const invitationStore = useInvitationStore()
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