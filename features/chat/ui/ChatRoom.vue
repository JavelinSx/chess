<!-- ChatRoom.vue -->
<template>
    <div class="h-full flex flex-col">
        <UAlert v-if="showPrivacyWarning" color="red" icon="i-heroicons-exclamation-triangle"
            :title="t('chat.privacyWarning')" :description="t('chat.cannotSendMessagePrivacy')" class="m-4 h-full" />

        <div ref="messagesContainer" class="flex-grow overflow-y-auto p-4 space-y-4" @scroll="handleScroll">
            <TransitionGroup name="message" tag="div">
                <template v-for="message in chatStore.sortedMessages" :key="String(message._id)">
                    <ChatMessages :message="message" :is-own="message.senderId === userStore.user?._id" />
                </template>
            </TransitionGroup>

            <div v-if="isLoading" class="flex justify-center py-2">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6" />
            </div>
        </div>

        <div class="p-4 border-t dark:border-gray-700">
            <form @submit.prevent="sendMessage">
                <div class="flex gap-2">
                    <UTextarea v-model="messageText" :disabled="isRoomBlocked" :placeholder="t('chat.enterMessage')"
                        :rows="1" class="flex-1" @keydown.enter.exact.prevent="sendMessage" />
                    <UButton type="submit" :loading="isSending" :disabled="isRoomBlocked || !messageText.trim()"
                        color="primary" icon="i-heroicons-paper-airplane" />
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import ChatMessages from './ChatMessages.vue';
import { throttle } from 'lodash';
import { usePrivateChatSSE } from '~/composables/chat/usePrivateChatSSE';
import type { ChatMessage } from '~/server/services/chat/types';
import { chatApi } from '~/shared/api/chat';
import { useChatStore } from '~/stores/chat';
const { t } = useI18n();
const messagesContainer = ref<HTMLElement>();
const messageText = ref('');
const isLoading = ref(false);
const isSending = ref(false);
const currentPage = ref(1);
const chatStore = useChatStore();
const userStore = useUserStore()
if (chatStore.currentRoom) {
    usePrivateChatSSE(String(chatStore.currentRoom._id));
}
// 1. Проверьте значение в chatStore.blockedRooms
console.log('blockedRooms:', chatStore.blockedRooms);

// 2. Проверьте вычисление isRoomBlocked
const isRoomBlocked = computed(() => {
    console.log('Current room:', chatStore.currentRoom?._id);
    console.log('Is blocked:', chatStore.blockedRooms.has(String(chatStore.currentRoom?._id)));
    return chatStore.blockedRooms.has(String(chatStore.currentRoom?._id));
});

const showPrivacyWarning = computed(() => isRoomBlocked.value);

const sendMessage = async () => {
    if (!messageText.value.trim() || isRoomBlocked.value || !chatStore.currentRoom) return;

    isSending.value = true;
    try {
        const success = await chatStore.sendMessage(
            String(chatStore.currentRoom._id),
            messageText.value
        );

        if (success) {
            messageText.value = '';
            await nextTick();
            scrollToBottom();
        }
    } finally {
        isSending.value = false;
    }
};

const throttledScroll = throttle(async () => {
    if (!messagesContainer.value || isLoading.value || !chatStore.currentRoom) return;

    const { scrollTop } = messagesContainer.value;
    if (scrollTop < 100) {
        isLoading.value = true;
        try {
            const response = await chatApi.getMessages(
                String(chatStore.currentRoom._id),
                currentPage.value + 1
            );
            if (response.data?.messages.length) {
                currentPage.value++;
                chatStore.currentRoom.messages.unshift(...response.data.messages);
            }
        } finally {
            isLoading.value = false;
        }
    }
}, 200);

const handleScroll = (e: Event) => {
    throttledScroll();
};

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};

onMounted(() => {
    nextTick(scrollToBottom);
});

watch(() => chatStore.currentRoom?._id, () => {
    currentPage.value = 1;
    nextTick(scrollToBottom);
});
</script>