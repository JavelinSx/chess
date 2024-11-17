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
const route = useRoute();
const router = useRouter();
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
            // Очищаем сохраненные параметры
            localStorage.removeItem('vk_code_verifier');
            localStorage.removeItem('vk_state');

            await router.push('/');
        } else {
            throw new Error(completeResponse.error || 'Failed to complete authentication');
        }
    } catch (e) {
        console.error('VK auth error:', e);
        error.value = e instanceof Error ? e.message : 'Authentication failed';
    }
});
</script>