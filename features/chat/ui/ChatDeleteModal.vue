<template>
    <UModal :model-value="isOpen" @close="onClose">
        <div class="p-4">
            <h3 class="text-lg font-semibold mb-4">
                {{ t('chat.confirmDelete') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
                {{ t('chat.deleteRoomWarning') }}
            </p>
            <div class="flex justify-end gap-2">
                <UButton color="gray" variant="outline" @click="onClose">
                    {{ t('common.cancel') }}
                </UButton>
                <UButton color="red" @click="onConfirm" :loading="loading">
                    {{ t('common.delete') }}
                </UButton>
            </div>
        </div>
    </UModal>
</template>

<script setup lang="ts">
const { t } = useI18n();

const props = defineProps<{
    isOpen: boolean
    loading?: boolean
}>();

const emit = defineEmits<{
    confirm: []
    close: []
}>();

const onConfirm = () => {
    emit('confirm');
};

const onClose = () => {
    emit('close');
};
</script>