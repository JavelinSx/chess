<template>
    <div class="mt-4">
        <h2 class="text-xl font-semibold mb-4">{{ t('profile.changePassword') }}</h2>
        <UForm :state="formState" @submit.prevent="changePassword" class="flex flex-col gap-2">
            <UFormGroup :label="t('profile.currentPassword')" name="currentPassword">
                <UInput v-model="formState.currentPassword" type="password" required />
            </UFormGroup>

            <UFormGroup :label="t('profile.newPassword')" name="newPassword">
                <UInput v-model="formState.newPassword" type="password" required />
            </UFormGroup>

            <UFormGroup :label="t('profile.confirmNewPassword')" name="confirmNewPassword">
                <UInput v-model="formState.confirmNewPassword" type="password" required />
            </UFormGroup>

            <UButton class="mt-4 justify-center" size="lg" type="submit" color="primary" :loading="isLoading">
                {{ t('profile.changePassword') }}
            </UButton>
        </UForm>

        <UAlert v-if="error" color="red" :title="error" icon="i-heroicons-exclamation-circle" class="mt-4" />
        <UAlert v-if="success" color="green" :title="t('profile.passwordChangedSuccessfully')"
            icon="i-heroicons-check-circle" class="mt-4" />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useUserStore } from '~/store/user';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const userStore = useUserStore();
const isLoading = ref(false);
const error = ref('');
const success = ref(false);

const formState = reactive({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
});

const changePassword = async () => {
    if (formState.newPassword !== formState.confirmNewPassword) {
        error.value = t('profile.newPasswordsDoNotMatch');
        return;
    }

    isLoading.value = true;
    error.value = '';
    success.value = false;

    try {
        await userStore.changePassword(formState.currentPassword, formState.newPassword);
        success.value = true;
        formState.currentPassword = '';
        formState.newPassword = '';
        formState.confirmNewPassword = '';
    } catch (err) {
        error.value = err instanceof Error ? err.message : t('profile.failedToChangePassword');
    } finally {
        isLoading.value = false;
    }
};
</script>