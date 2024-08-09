<template>
    <UCard class="auth-form">
        <UForm :state="formState" @submit="handleRegister" class="flex flex-col gap-4">
            <h2 class="text-2xl font-bold mb-6 text-center">Register</h2>

            <UFormGroup label="Username" name="username">
                <UInput v-model="formState.username" type="text" placeholder="Enter your username"
                    autocomplete="username" size="lg" required />
            </UFormGroup>

            <UFormGroup label="Email" name="email">
                <UInput v-model="formState.email" type="email" placeholder="Enter your email" autocomplete="email"
                    size="lg" required />
            </UFormGroup>

            <UFormGroup label="Password" name="password">
                <UInput v-model="formState.password" type="password" placeholder="Enter your password"
                    autocomplete="new-password" required :minlength="8" size="lg" />
            </UFormGroup>

            <UButton type="submit" color="primary" block :loading="isLoading" class="mt-3 mb-6 h-11 text-base">
                Register
            </UButton>
        </UForm>
    </UCard>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuth } from '~/composables/useAuth';

const authStore = useAuth();
const isLoading = ref(false);

const formState = reactive({
    username: '',
    email: '',
    password: '',
});

const handleRegister = async () => {
    isLoading.value = true;
    try {
        await authStore.register(formState.username, formState.email, formState.password);
        navigateTo('/login');
    } catch (error) {
        console.error('Registration error:', error);
        // Здесь можно добавить обработку ошибок, например, показать уведомление пользователю
    } finally {
        isLoading.value = false;
    }
};
</script>

<style lang="scss" scoped>
.auth-form {
    max-width: 400px;
    margin: 2rem auto;
}
</style>