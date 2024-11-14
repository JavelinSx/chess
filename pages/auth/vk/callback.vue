<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const error = ref('');
const { t } = useI18n();

onMounted(async () => {
    const { code, state } = route.query;
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
                device_id: crypto.randomUUID()
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