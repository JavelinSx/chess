<template>
    <UAccordion :items="accordionItems" class="mt-4">
        <template #default="{ item, open, toggle }">
            <div class="border border-gray-200 rounded-md overflow-hidden mb-4">
                <button @click="toggle"
                    class="w-full flex justify-between items-center p-4  transition-all duration-200">
                    <span class="font-semibold">{{ item.label }}</span>
                    <UIcon :name="open ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                        class="transform transition-transform duration-200" :class="{ 'rotate-180': open }" />
                </button>
                <div :class="[
                    'overflow-hidden transition-[height] duration-200 ease-out',
                    open ? 'h-auto' : 'h-0'
                ]">
                    <div class="p-4" @click.stop>
                        <UForm :state="formState" @submit.prevent="changePassword">
                            <UFormGroup label="Current Password" name="currentPassword">
                                <UInput v-model="formState.currentPassword" type="password" required />
                            </UFormGroup>

                            <UFormGroup label="New Password" name="newPassword">
                                <UInput v-model="formState.newPassword" type="password" required />
                            </UFormGroup>

                            <UFormGroup label="Confirm New Password" name="confirmNewPassword">
                                <UInput v-model="formState.confirmNewPassword" type="password" required />
                            </UFormGroup>

                            <UButton class="mt-4" type="submit" color="primary" :loading="isLoading">Change Password
                            </UButton>
                        </UForm>

                        <UAlert v-if="error" color="red" :title="error" icon="i-heroicons-exclamation-circle"
                            class="mt-4" />
                        <UAlert v-if="success" color="green" title="Password changed successfully!"
                            icon="i-heroicons-check-circle" class="mt-4" />
                    </div>
                </div>
            </div>
        </template>
    </UAccordion>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useUserStore } from '~/store/user';

const userStore = useUserStore();
const isLoading = ref(false);
const error = ref('');
const success = ref(false);

const accordionItems = [{
    label: 'Change Password',
    defaultOpen: false
}];

const formState = reactive({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
});

const changePassword = async () => {
    if (formState.newPassword !== formState.confirmNewPassword) {
        error.value = 'New passwords do not match';
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
        error.value = err instanceof Error ? err.message : 'Failed to change password';
    } finally {
        isLoading.value = false;
    }
};
</script>