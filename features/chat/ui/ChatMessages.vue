<!-- ChatMessage.vue -->
<template>
    <div :class="[
        'flex',
        isOwn ? 'justify-end' : 'justify-start'
    ]">
        <div :class="[
            'max-w-[70%] rounded-lg px-4 py-2',
            isOwn
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700'
        ]">
            <p class="break-words">{{ message.content }}</p>
            <div class="flex items-center gap-1 mt-1">
                <span class="text-xs opacity-70">
                    {{ formatTime(message.timestamp) }}
                </span>
                <UIcon v-if="isOwn" :name="getStatusIcon" class="h-3 w-3" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/server/services/chat/types';

const props = defineProps<{
    message: ChatMessage;
    isOwn: boolean;
}>();

const getStatusIcon = computed(() => {
    switch (props.message.status.status) {
        case 'read':
            return 'i-heroicons-check-circle';
        case 'delivered':
            return 'i-heroicons-check';
        default:
            return 'i-heroicons-clock';
    }
});

const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(timestamp));
};
</script>