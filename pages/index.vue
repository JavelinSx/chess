<!-- pages/index.vue -->
<template>
    <div class="flex flex-col items-center justify-center gap-4 sm:px-4">
        <p v-if="isAuthenticated">
            {{ t('common.hello') }} {{ user?.username }}!
        </p>
        <p v-else>
            <NuxtLink to="/login">{{ t('auth.login') }}</NuxtLink> {{ t('common.or') }}
            <NuxtLink to="/register">{{ t('auth.register') }}</NuxtLink> {{ t('misc.startPlaying') }}.
        </p>

        <UserList v-if="isAuthenticated" />

    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
import { useInvitationStore } from '~/stores/invitation';
import UserList from '~/features/user-list/UserList.vue';

const { isAuthenticated, user } = useAuth()

definePageMeta({
    requiresAuth: true
});
</script>