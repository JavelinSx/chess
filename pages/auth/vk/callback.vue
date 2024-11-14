<template>
    <div class="flex items-center justify-center min-h-screen">
        <UCard v-if="error">
            <p class="text-red-500">{{ error }}</p>
            <UButton to="/login" class="mt-4">
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
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';
const route = useRoute();
const router = useRouter();
const error = ref('');
const { t } = useI18n();
const authStore = useAuthStore();
const userStore = useUserStore();

onMounted(async () => {
    const { code, state, device_id } = route.query;
    if (!code || !state) {
        error.value = 'Missing required parameters';
        return;
    }
    const codeVerifier = localStorage.getItem('codeVerifier')

    try {
        const exchangeResponse = await $fetch('/api/auth/vk/callback', {
            method: 'POST',
            body: {
                code: code,
                codeVerifier: codeVerifier,
                device_id: device_id
            }
        });

        if (!exchangeResponse.data?.success) {
            throw new Error(exchangeResponse.error || 'Failed to exchange code');
        }

        const completeResponse = await $fetch('/api/auth/vk/complete', {
            method: 'POST'
        });

        if (completeResponse.data) {
            // Напрямую используем данные из ответа для установки состояния авторизации
            authStore.setIsAuthenticated(true);
            userStore.setUser(completeResponse.data.user);
            router.push('/');
        } else if (completeResponse.error) {
            error.value = completeResponse.error;
        }
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Authentication failed';
    }
});
</script>