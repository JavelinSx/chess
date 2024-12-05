<!-- ChatButton.vue -->
<template>
    <UButton @click="openChat" icon="i-heroicons-chat-bubble-left-ellipsis" :disabled="isLoading">
        {{ t('chat.chat') }}
        <UIcon v-if="isLoading" name="i-heroicons-arrow-path" class="animate-spin ml-2" />
    </UButton>
</template>

<script setup lang="ts">
import type { ChatSetting } from '~/server/types/user';
import { chatApi } from '~/shared/api/chat';
import { useChatStore } from '~/stores/chat';

const props = defineProps<{
    userId: string;
    username: string;
    chatSetting: ChatSetting;
}>();
const { t } = useI18n();
const isLoading = ref(false);
const chatStore = useChatStore();
const userStore = useUserStore();

const openChat = async () => {
    if (!userStore.user) return;

    isLoading.value = true;
    try {
        const response = await chatApi.createOrGetRoom({
            userId: userStore.user._id,
            username: userStore.user.username,
            userChatSetting: userStore.user.chatSetting,
            userAvatar: userStore.user.avatar || '/images/default-avatar.png',
            recipientId: props.userId,
            recipientUsername: props.username,
            recipientChatSetting: props.chatSetting,
            recipientAvatar: userStore.getUserInUserList(props.userId)?.avatar || '/images/default-avatar.png'
        });

        if (response.data) {
            chatStore.addRoom(response.data);
            await chatStore.setActiveRoom(String(response.data._id));
            if (!chatStore.isOpen) chatStore.toggleChat();
        }
    } finally {
        isLoading.value = false;
    }
};
</script>