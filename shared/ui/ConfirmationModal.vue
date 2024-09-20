<!-- components/ConfirmationModal.vue -->
<template>
    <UModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                        {{ title }}
                    </h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
                        @click="close" />
                </div>
            </template>
            <div class="py-4">
                <p>{{ message }}</p>
            </div>
            <template #footer>
                <div class="flex justify-end space-x-3">
                    <UButton color="gray" variant="soft" @click="close">
                        {{ cancelText }}
                    </UButton>
                    <UButton color="primary" @click="confirm">
                        {{ confirmText }}
                    </UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm'): void;
    (e: 'cancel'): void;
}>();

const close = () => {
    emit('update:modelValue', false);
    emit('cancel');
};

const confirm = () => {
    emit('update:modelValue', false);
    emit('confirm');
};
</script>