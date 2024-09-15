<!-- RegisterForm.vue -->
<template>
    <UCard class="auth-form">
        <UForm :state="formState" @submit="handleRegister" :validate="validateForm" class="flex flex-col gap-4">
            <h2 class="text-2xl font-bold mb-6 text-center">{{ t('register') }}</h2>

            <UFormGroup :label="t('username')" name="username">
                <UInput v-model="formState.username" type="text" :placeholder="t('enterUsername')"
                    autocomplete="username" size="lg" required />
            </UFormGroup>

            <UFormGroup :label="t('email')" name="email">
                <UInput v-model="formState.email" type="email" :placeholder="t('enterEmail')" autocomplete="email"
                    size="lg" required />
            </UFormGroup>

            <UFormGroup :label="t('password')" name="password">
                <UInput v-model="formState.password" type="password" :placeholder="t('enterPassword')"
                    autocomplete="new-password" required :minlength="8" size="lg" />
            </UFormGroup>

            <UButton type="submit" color="primary" block :loading="isLoading" class="mt-3 mb-6 h-11 text-base">
                {{ t('register') }}
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
const success = ref(false);

const formState = reactive({
    username: '',
    email: '',
    password: '',
});

const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formState.username) {
        errors.username = 'Username is required';
    } else if (formState.username.length < 3) {
        errors.username = 'Username must be at least 3 characters long';
    }
    if (!formState.email) {
        errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+/.test(formState.email)) {
        errors.email = 'Invalid email format';
    }
    if (!formState.password) {
        errors.password = 'Password is required';
    } else if (formState.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
    }

    return Object.keys(errors).map(key => ({
        path: key,
        message: errors[key]
    }));
};

const handleRegister = async () => {
    isLoading.value = true;
    error.value = '';
    success.value = false;
    try {
        await authStore.register(formState.username, formState.email, formState.password);
        success.value = true;
        navigateTo('/login')
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'An error occurred during registration';
    } finally {
        isLoading.value = false;
    }
};
</script>