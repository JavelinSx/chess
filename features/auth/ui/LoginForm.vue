<template>
    <UCard class="auth-form sm:w-96">
        <UForm :state="formState" @submit="handleLogin" class="flex flex-col gap-4">
            <h2 class="text-2xl font-bold mb-6 text-center">{{ t('auth.login') }}</h2>
            <UFormGroup :label="t('auth.email')" name="email">
                <UInput v-model="formState.email" type="email" :placeholder="t('auth.enterEmail')" autocomplete="email"
                    size="lg" required />
            </UFormGroup>

            <UFormGroup :label="t('auth.password')" name="password">
                <UInput v-model="formState.password" type="password" :placeholder="t('auth.enterPassword')"
                    autocomplete="current-password" required size="lg" />
            </UFormGroup>

            <UButton type="submit" color="primary" block :loading="isLoading" class="mt-3 mb-6 h-11 text-base">
                {{ t('auth.login') }}
            </UButton>
        </UForm>
        <Github></Github>
        <UAlert v-if="alert.alert.value.type" :type="alert.alert.value.type" :title="t(alert.alert.value.message)"
            :color="authStore.isAuthenticated ? 'green' : 'red'" variant="soft"
            :icon="getAlertIcon(alert.alert.value.type)" class="mt-4"
            :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link' }"
            @close="alert.forceCloseAlert" />
    </UCard>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import Github from './Github.vue';
import { useAuth } from '~/composables/useAuth';
import { useAlert } from '~/composables/useAlert';

const { t } = useI18n();
const authStore = useAuth();
const alert = useAlert(5000);  // алерт будет автоматически закрываться через 5 секунд
const isLoading = ref(false);

const formState = reactive({
    email: '',
    password: '',
});

const getAlertIcon = (type: string | null) => {
    switch (type) {
        case 'error':
            return 'i-heroicons-exclamation-circle';
        case 'success':
            return 'i-heroicons-check-circle';
        default:
            return 'i-heroicons-information-circle';
    }
};

const handleLogin = async () => {
    isLoading.value = true;
    try {
        await authStore.login(formState.email, formState.password);
        if (authStore.isAuthenticated) {
            alert.setAlert('success', 'auth.loginSuccessful');
            setTimeout(() => {
                navigateTo('/');
            }, 1000);
        }
    } catch (e) {
        if (e instanceof Error) {
            if (e.message.includes("Password must be at least 8 characters long")) {
                alert.setAlert('error', 'auth.passwordTooShort');
            } else {
                alert.setAlert('error', 'auth.invalidCredentials');
            }
        } else {
            alert.setAlert('error', 'errors.unknownError');
        }
    } finally {
        isLoading.value = false;
    }
};
</script>