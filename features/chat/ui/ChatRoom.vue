<template>
    <div class="h-full flex flex-col">
        <div ref="messagesContainer" class="flex-grow overflow-y-auto p-4 space-y-4" @scroll="handleScroll">
            <TransitionGroup name="message" tag="div" class="flex flex-col-reverse">
                <div v-for="message in chatStore.messages" :key="message._id" class="message-item">
                    <ChatMessages :message="message" :is-own="isOwnMessage(message)" />
                </div>
            </TransitionGroup>

            <div v-if="chatStore.isLoading" class="flex justify-center py-2">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6" />
            </div>
        </div>

        <div class="p-4 border-t dark:border-gray-700">
            <form @submit.prevent="sendMessage">
                <div class="flex gap-2">
                    <UTextarea v-model="messageText" :placeholder="t('chat.enterMessage')" :rows="1" class="flex-1"
                        @keydown.enter.exact.prevent="sendMessage" />
                    <UButton type="submit" :loading="isSending" :disabled="!messageText.trim()" color="primary"
                        icon="i-heroicons-paper-airplane" />
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useChatStore } from '#imports';
import { throttle } from 'lodash';
import type { ChatMessage } from '~/server/services/chat/types';
import ChatMessages from './ChatMessages.vue';

const chatStore = useChatStore();
const userStore = useUserStore();
const { t } = useI18n();

const messagesContainer = ref<HTMLElement>();
const messageText = ref('');
const isSending = ref(false);

const isOwnMessage = (message: ChatMessage) =>
    message.senderId === userStore.user?._id;

const handleScroll = throttle((event: Event) => {
    const element = event.target as HTMLElement;
    if (element.scrollTop <= 50 && chatStore.hasMoreMessages && !chatStore.isLoading) {
        chatStore.loadMessages(chatStore.currentPage + 1);
    }
}, 200);

const sendMessage = async () => {
    if (!messageText.value.trim()) return;

    isSending.value = true;
    try {
        await chatStore.sendMessage(messageText.value);
        messageText.value = '';
        nextTick(scrollToBottom);
    } finally {
        isSending.value = false;
    }
};

const scrollToBottom = () => {
    if (!messagesContainer.value) return;
    const { scrollHeight, clientHeight } = messagesContainer.value;
    messagesContainer.value.scrollTop = scrollHeight - clientHeight;
};

onMounted(() => {
    if (chatStore.currentRoom) {
        nextTick(scrollToBottom);
    }
});

// Прокручиваем к последнему сообщению при получении новых сообщений
watch(() => chatStore.messages, () => {
    nextTick(scrollToBottom);
}, { deep: true });
</script>

<style scoped>
.message-enter-active,
.message-leave-active {
    transition: all 0.3s ease;
}

.message-enter-from,
.message-leave-to {
    opacity: 0;
    transform: translateY(20px);
}
</style>