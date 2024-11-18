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
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';
const authStore = useAuthStore()
const userStore = useUserStore()
const route = useRoute();
const error = ref('');
const { t } = useI18n();

onMounted(async () => {
    const { code, state, device_id } = route.query;
    const savedState = localStorage.getItem('vk_state');
    const codeVerifier = localStorage.getItem('vk_code_verifier');

    if (!code || !state || !codeVerifier) {
        error.value = 'Missing required parameters';
        return;
    }

    if (state !== savedState) {
        error.value = 'Invalid state parameter';
        return;
    }

    try {
        const exchangeResponse = await $fetch('/api/auth/vk/callback', {
            method: 'POST',
            body: {
                code,
                codeVerifier,
                device_id
            }
        });

        if (!exchangeResponse.data?.success) {
            throw new Error(exchangeResponse.error || 'Failed to exchange code');
        }

        const completeResponse = await $fetch('/api/auth/vk/complete', {
            method: 'POST'
        });

        if (completeResponse.data) {
            // Очищаем параметры
            localStorage.removeItem('vk_code_verifier');
            localStorage.removeItem('vk_state');

            // Устанавливаем состояние авторизации
            authStore.setIsAuthenticated(true);
            if (completeResponse.data.user) {
                userStore.setUser(completeResponse.data.user);
            }

            // Добавляем небольшую задержку перед редиректом
            await new Promise(resolve => setTimeout(resolve, 100));

            // Проверяем авторизацию перед редиректом
            const authCheck = await $fetch<{ isAuthenticated: boolean }>('/api/auth/check');
            if (authCheck.isAuthenticated) {
                navigateTo('/', { replace: true });
            } else {
                throw new Error('Authentication check failed');
            }
        } else {
            throw new Error(completeResponse.error || 'Failed to complete authentication');
        }
    } catch (e) {
        console.error('VK auth error:', e);
        error.value = e instanceof Error ? e.message : 'Authentication failed';
    }
});
</script>