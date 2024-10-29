<!-- pages/index.vue -->
<template>
    <div class="flex flex-col items-center justify-center gap-4">
        <p v-if="isAuthenticated">
            {{ t('common.hello') }} {{ user?.username }}!
        </p>
        <p v-else>
            <NuxtLink to="/login">{{ t('auth.login') }}</NuxtLink> {{ t('common.or') }}
            <NuxtLink to="/register">{{ t('auth.register') }}</NuxtLink> {{ t('misc.startPlaying') }}.
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
const { isAuthenticated, user } = useAuth()
const authChecked = ref(false);

// onMounted(async () => {
//     authChecked.value = true;
//     if (isAuthenticated.value) {
//         await userStore.updateUserStatus(user.value?._id!, true, false);
//     }
// });
// watch(isAuthenticated, async (newValue) => {
//     if (newValue) {
//         await userStore.updateUserStatus(user.value?._id!, true, false);
//     }
// });
definePageMeta({
    requiresAuth: true
});
</script>