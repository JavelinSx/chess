<template>
    <div class="fixed bottom-0 right-0 w-80 bg-white shadow-lg z-50">
        <div class="flex justify-between items-center p-3 bg-gray-100 border-b">
            <h3 class="font-semibold">Chat with {{ otherUserName }}</h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="closeChat" />
        </div>
        <div ref="messagesContainer" class="h-64 overflow-y-auto p-3">
            <template v-if="currentMessages.length">
                <div v-for="message in currentMessages" :key="message.id"
                    :class="['mb-2', message.senderId === currentUserId ? 'text-right' : 'text-left']">
                    <div :class="['inline-block p-2 rounded-lg',
                        message.senderId === currentUserId ? 'bg-blue-100' : 'bg-gray-100']">
                        {{ message.content }}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">{{ formatTimestamp(message.timestamp) }}</div>
                </div>
            </template>
            <div v-else-if="chatStore.isLoading" class="text-center text-gray-500 mt-4">
                Loading messages...
            </div>
            <div v-else class="text-center text-gray-500 mt-4">
                No messages yet. Start the conversation!
            </div>
        </div>
        <div class="p-3 border-t">
            <div class="flex">
                <UInput v-model="newMessage" placeholder="Type a message..." class="flex-grow mr-2"
                    @keyup.enter="sendMessage" />
                <UButton color="primary" @click="sendMessage" :loading="isSending">Send</UButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useChatStore } from '~/store/chat'
import { useUserStore } from '~/store/user'
import { storeToRefs } from 'pinia'
import type { ClientChatRoom } from '~/server/types/chat'

const props = defineProps<{
    otherUserId: string
}>();

const chatStore = useChatStore();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const { messages, currentRoomId, isLoading } = storeToRefs(chatStore);

const newMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);
const isSending = ref(false);

const currentUserId = computed(() => user.value?._id || '');

const currentRoom = computed(() =>
    currentRoomId.value ? chatStore.chatRooms[currentRoomId.value] : null
);

const otherUserName = computed(() => {
    if (!currentRoom.value) return 'User';
    const otherUserId = currentRoom.value.participantIds.find(id => id !== currentUserId.value);
    const otherUser = userStore.getUserById(otherUserId!);
    return otherUser ? otherUser.username : 'Unknown User';
});

const currentMessages = computed(() => {
    return messages.value[currentRoomId.value || ''] || [];
});

onMounted(async () => {
    try {
        await chatStore.openChat(props.otherUserId);
        scrollToBottom();
    } catch (err) {
        console.error('Error opening chat:', err);
        // Здесь можно добавить обработку ошибки, например, показ уведомления
    }
});

watch(currentMessages, () => {
    scrollToBottom();
});

async function sendMessage() {
    if (newMessage.value.trim()) {
        isSending.value = true;
        try {
            await chatStore.sendMessage(newMessage.value);
            newMessage.value = '';
        } catch (err) {
            console.error('Error sending message:', err);
            // Здесь можно добавить обработку ошибки
        } finally {
            isSending.value = false;
        }
    }
}

function closeChat() {
    chatStore.closeChat();
}

function formatTimestamp(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString();
}

function scrollToBottom() {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
}
</script>