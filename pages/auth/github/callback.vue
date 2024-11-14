// pages/auth/github/callback.vue
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
const { handleCallback } = useGithubAuth();
const error = ref('');
const { t } = useI18n()

onMounted(async () => {
    const { code, state } = route.query;

    if (!code || !state) {
        error.value = 'Missing required parameters';
        return;
    }

    try {
        await handleCallback(code.toString(), state.toString());
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Authentication failed';
    }
});
</script>