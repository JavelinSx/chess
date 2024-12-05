<!-- features/profile-edit/ui/DeleteAccount.vue -->
<template>
    <UCard>
        <template #header>
            <h3 class="text-xl font-semibold text-red-600">{{ t('profile.deleteAccount') }}</h3>
        </template>
        <p class="mb-4">{{ t('profile.deleteAccountWarning') }}</p>
        <UButton color="red" @click="confirmDelete">{{ t('profile.deleteAccountButton') }}</UButton>
    </UCard>
    <UModal v-model="showConfirmation">
        <UCard>
            <template #header>
                <h3 class="text-xl font-semibold">{{ t('profile.confirmDeleteAccount') }}</h3>
            </template>
            <p>{{ t('profile.deleteAccountConfirmation') }}</p>
            <template #footer>
                <div class="flex justify-end space-x-2">
                    <UButton color="gray" @click="showConfirmation = false">{{ t('common.cancel') }}</UButton>
                    <UButton color="red" @click="deleteAccount" :loading="isDeleting">{{ t('common.confirm') }}
                    </UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '~/stores/user';

const { t } = useI18n();
const userStore = useUserStore();

const showConfirmation = ref(false);
const isDeleting = ref(false);

const confirmDelete = () => {
    showConfirmation.value = true;
};

const deleteAccount = async () => {
    isDeleting.value = true;
    try {
        await userStore.deleteAccount();
    } catch (error) {
        console.error('Failed to delete account:', error);
        // Показать сообщение об ошибке пользователю
    } finally {
        isDeleting.value = false;
        showConfirmation.value = false;
    }
};
</script>