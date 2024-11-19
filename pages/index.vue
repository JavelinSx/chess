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
import { useInvitationStore } from '~/store/invitation';
import UserList from '~/features/user-list/UserList.vue';
import GameInvitationModal from '~/features/invite/GameInvitationModal.vue';

const invitationStore = useInvitationStore()

const { isAuthenticated, user } = useAuth()

definePageMeta({
    requiresAuth: true
});
</script>