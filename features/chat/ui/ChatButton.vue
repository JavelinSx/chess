<template>
    <UButton @click="openChat" icon="i-heroicons-chat-bubble-left-ellipsis">
        {{ t('chat.chat') }}
    </UButton>
</template>

<script setup lang="ts">
import { useChatStore } from '~/store/chat';
import { useUserStore } from '~/store/user';
import type { ChatSetting } from '~/server/types/user';

const { t } = useI18n();
const props = defineProps<{
    userId: string;
    username: string;
    chatSetting: ChatSetting
}>();

const chatStore = useChatStore();
const userStore = useUserStore();

const openChat = async () => {
    if (userStore.user) {
        const currentUser = {
            _id: userStore.user._id,
            username: userStore.user.username,
            chatSetting: userStore.user.chatSetting
        };
        const otherUser = {
            _id: props.userId,
            username: props.username,
            chatSetting: props.chatSetting
        };
        await chatStore.createOrGetRoom(currentUser, otherUser);
        if (chatStore.isOpen) {
            chatStore.setActiveRoom(chatStore.currentRoom?._id.toString() || null);
        } else {
            chatStore.toggleChat();
        }
    }
};
</script>