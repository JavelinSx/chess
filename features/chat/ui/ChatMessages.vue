<!-- ChatMessage.vue -->
<template>
    <div :class="['flex mb-2', isOwn ? 'justify-end' : 'justify-start']">
        <div :class="[
            'max-w-[70%] rounded-lg px-4 py-2',
            isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
        ]">
            <p class="break-words">{{ message.content }}</p>
            <span class="text-xs opacity-70">
                {{ formatTime(message.timestamp) }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/server/services/chat/types';

defineProps<{
    message: ChatMessage;
    isOwn: boolean;
}>();

const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(timestamp));
};
</script>