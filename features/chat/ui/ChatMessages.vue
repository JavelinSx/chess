<template>
    <div class="h-full flex flex-col">
        <div ref="messagesContainer" class="flex-grow overflow-y-auto p-4 space-y-2">
            <div v-for="message in chatStore.sortedMessages" :key="message.timestamp"
                :class="['flex', message._id.toString() === userStore.user?._id ? 'justify-end' : 'justify-start']">
                <div class="w-4/5"> <!-- This div ensures 80% width -->
                    <div :class="['rounded-lg p-2 inline-block w-full',
                        message._id.toString() === userStore.user?._id ? 'bg-blue-500 text-white' : 'bg-gray-500']">
                        <p class="text-sm break-words">{{ message.content }}</p>
                        <span class="text-xs opacity-75 block text-right">{{ formatTime(message.timestamp) }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="p-4 bg-gray-100">
            <UForm :state="formState" @submit="sendMessage">
                <div class="flex items-center">
                    <UInput v-model="formState.content" placeholder="Type a message..." class="flex-grow mr-2" />
                    <UButton type="submit" color="primary" :disabled="!formState.content.trim()"
                        icon="i-heroicons-paper-airplane-20-solid">
                        Send
                    </UButton>
                </div>
            </UForm>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useChatStore } from '~/store/chat';
import { useUserStore } from '~/store/user';

const chatStore = useChatStore();
const userStore = useUserStore();

const formState = ref({
    content: '',
});

const sendMessage = async () => {
    if (!formState.value.content.trim()) return;
    await chatStore.sendMessage(formState.value.content);
    formState.value.content = '';
    // Прокрутка вниз после отправки сообщения
    nextTick(scrollToBottom);
};

const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const messagesContainer = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};


const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
};

// Прокрутка вниз при монтировании компонента (открытии чата)
onMounted(() => {
    scrollToBottom();
});

// Прокрутка вниз при изменении сообщений (получении новых сообщений)
watch(() => chatStore.sortedMessages, () => {
    nextTick(scrollToBottom);
}, { deep: true });
</script>

<style scoped>
.break-words {
    word-break: break-word;
}
</style>