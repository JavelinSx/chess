<!-- pages/index.vue -->
<template>
    <div class="flex flex-col items-center justify-center gap-4">
        <p v-if="isAuthenticated">
            {{ t('common.hello') }} {{ user?.username }}!
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
import { useUserStore } from '~/store/user';
import { useAuthStore } from '~/store/auth';
import { useInvitationStore } from '~/store/invitation';
import UserList from '~/features/user-list/UserList.vue';
import GameInvitationModal from '~/features/invite/GameInvitationModal.vue';

const invitationStore = useInvitationStore()
const userStore = useUserStore();
const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => userStore.user);
const intervalId = ref<number | null>(null);


onMounted(async () => {
    if (authStore.isAuthenticated) {
        await userStore.updateUserStatus(user.value?._id!, true, false);
    }
});


if (import.meta.client) {
    window.addEventListener('beforeunload', async () => {
        if (authStore.isAuthenticated) {
            await userStore.updateUserStatus(user.value?._id!, false, false);
        }
    });
}

definePageMeta({
    requiresAuth: true
});
</script>