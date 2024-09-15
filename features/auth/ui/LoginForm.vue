<!-- LoginForm.vue -->
<template>
    <UCard class="auth-form ">
        <UForm :state="formState" @submit="handleLogin" :validate="validateForm" class="flex flex-col gap-4">
            <h2 class="text-2xl font-bold mb-6 text-center">{{ t('login') }}</h2>
            <UFormGroup :label="t('email')" name="email" required>
                <UInput v-model="formState.email" type="email" :placeholder="t('enterEmail')" autocomplete="email"
                    size="lg" required />
            </UFormGroup>

            <UFormGroup :label="t('password')" name="password" required>
                <UInput v-model="formState.password" type="password" :placeholder="t('enterPassword')"
                    autocomplete="current-password" required :minlength="8" size="lg" />
            </UFormGroup>

            <UButton type="submit" color="primary" block :loading="isLoading" class="mt-3 mb-6 h-11 text-base">
                {{ t('login') }}
            </UButton>
        </UForm>
    </UCard>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuth } from '~/composables/useAuth';
const { t } = useI18n()
const authStore = useAuth();
const isLoading = ref(false);
const error = ref('');

const formState = reactive({
    email: '',
    password: '',
});

const validateForm = (state: typeof formState) => {
    const errors: { [key: string]: string } = {};
    if (!state.email) {
        errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+/.test(state.email)) {
        errors.email = 'Invalid email format';
    }
    if (!state.password) {
        errors.password = 'Password is required';
    } else if (state.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
    }
    return Object.keys(errors).map(key => ({
        path: key,
        message: errors[key]
    }));
};

const handleLogin = async () => {
    isLoading.value = true;
    error.value = '';
    try {
        await authStore.login(formState.email, formState.password);
        if (authStore.isAuthenticated) {
            navigateTo('/');
        }
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'An error occurred during login';
    } finally {
        isLoading.value = false;
    }
};
</script>