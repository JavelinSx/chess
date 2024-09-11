<template>
    <div class="h-full flex flex-col">
        <div ref="messagesContainer" class="flex-grow overflow-y-auto p-4" @scroll="handleScroll">
            <div class="flex flex-col space-y-4">
                <template v-for="message in chatStore.sortedMessages" :key="message._id">
                    <div :class="[
                        'flex',
                        isCurrentUserMessage(message) ? 'justify-end' : 'justify-start'
                    ]">
                        <div :class="[
                            'max-w-[70%]',
                            isCurrentUserMessage(message) ? 'items-end' : 'items-start'
                        ]">
                            <div :class="[
                                'rounded-lg p-3',
                                isCurrentUserMessage(message)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-800'
                            ]">
                                <p class="text-sm break-words">{{ message.content }}</p>
                                <span class="text-xs opacity-75 block mt-1">
                                    {{ formatTime(message.timestamp) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>
        <div class="p-4 bg-white">
            <UForm :state="formState" @submit="sendMessage">
                <div class="flex items-center">
                    <UInput v-model="formState.content" placeholder="Type a message..." class="flex-grow mr-2" />
                    <UButton type="submit" color="primary" :loading="isSending" :disabled="!formState.content.trim()"
                        icon="i-heroicons-paper-airplane-20-solid">
                        Send
                    </UButton>
                </div>
            </UForm>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useChatStore } from '~/store/chat';
import { useUserStore } from '~/store/user';

const chatStore = useChatStore();
const userStore = useUserStore();
const countMessage = computed(() => chatStore.sortedMessages.length);
const messagesContainer = ref<HTMLElement | null>(null);
const isSending = ref(false);

const formState = ref({
    content: '',
});

const isCurrentUserMessage = (message: any) => {
    return message._id === userStore.user?._id || message.username === userStore.user?.username;
};
const getUniqueKey = (message: any) => {
    return `${message._id}-${message.timestamp}`;
};
const sendMessage = async () => {
    if (!formState.value.content.trim()) return;
    isSending.value = true;
    try {
        await chatStore.sendMessage(formState.value.content);
        formState.value.content = '';
        nextTick(scrollToBottom);
    } catch (error) {
        console.error('Error sending message:', error);
    } finally {
        isSending.value = false;
    }
};

const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const handleScroll = async () => {
    if (messagesContainer.value) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
        if (scrollTop < 400 && chatStore.hasMoreMessages && !chatStore.isLoading) {
            const oldScrollHeight = scrollHeight;
            const oldScrollTop = scrollTop;
            await chatStore.loadMoreMessages();
            nextTick(() => {
                if (messagesContainer.value) {
                    const newScrollHeight = messagesContainer.value.scrollHeight;
                    const scrollTopDiff = newScrollHeight - oldScrollHeight;
                    messagesContainer.value.scrollTop = oldScrollTop + scrollTopDiff;
                }
            });
        }
    }
};

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};


onMounted(() => {
    if (chatStore.activeRoomId) {
        chatStore.loadMoreMessages();
    }
    nextTick(() => {
        scrollToBottom();
        console.log(`Initial scroll position: ${messagesContainer.value?.scrollTop}`);
    });
});


watch(() => chatStore.activeRoomId, (newRoomId) => {
    if (newRoomId) {
        chatStore.loadMoreMessages();
    }
});


watch(() => chatStore.totalPages, (newTotalPages) => {
    console.log(`Total pages updated: ${newTotalPages}`);
});

watch(() => chatStore.sortedMessages, (newMessages, oldMessages) => {
    if (newMessages.length > oldMessages.length) {
        nextTick(scrollToBottom);
    }
}, { deep: true });

const hasActiveRoom = computed(() => !!chatStore.activeRoomId);

</script>

<style scoped>
.break-words {
    word-break: break-word;
}
</style>