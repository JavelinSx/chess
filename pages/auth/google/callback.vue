<!-- pages/auth/google/callback.vue -->
<template>
    <div class="min-h-screen flex items-center justify-center">
        <UCard v-if="error" class="text-center">
            <p class="text-red-500">{{ error }}</p>
            <UButton class="mt-4" to="/login">
                {{ t('common.backToLogin') }}
            </UButton>
        </UCard>
        <UCard v-else>
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8" />
            <p>{{ t('auth.authenticating') }}</p>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useUserStore } from '~/stores/user';
const route = useRoute();
const authStore = useAuthStore();
const userStore = useUserStore();
const error = ref('');
const { t } = useI18n();

onMounted(async () => {
    const { code } = route.query;

    if (!code) {
        error.value = 'Authorization code is missing';
        return;
    }

    try {
        const response = await $fetch('/api/auth/google/callback', {
            method: 'GET',
            params: { code }
        });

        if (response.data) {
            authStore.setIsAuthenticated(true);
            userStore.setUser(response.data.user);
            navigateTo('/');
        } else if (response.error) {
            error.value = response.error;
        }
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Authentication failed';
        console.error('Callback error:', e);
    }
});
</script>