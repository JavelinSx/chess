<!-- features/auth/ui/Google.vue -->
<template>
    <UButton class="w-full h-10" :loading="isLoading" @click="initiateAuth">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo"
            class="w-5 h-5 mr-2" />
        {{ t('auth.continueWithGoogle') }}
    </UButton>
</template>

<script setup lang="ts">
const isLoading = ref(false);
const { t } = useI18n();

async function initiateAuth() {
    try {
        isLoading.value = true;
        const response = await $fetch('/api/auth/google/init', {
            method: 'POST'
        });

        if (response.authUrl) {
            window.location.href = response.authUrl;
        }
    } catch (error) {
        console.error('Failed to initiate Google auth:', error);
    } finally {
        isLoading.value = false;
    }
}
</script>