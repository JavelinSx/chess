<template>
    <UButton @click="openChat" icon="i-heroicons-chat-bubble-left-ellipsis">
        {{ t('chat') }}
    </UButton>
</template>

<script setup lang="ts">
import { useChatStore } from '~/store/chat';
import { useUserStore } from '~/store/user';
const { t } = useI18n();
const props = defineProps<{
    userId: string;
    username: string;
}>();

const chatStore = useChatStore();
const userStore = useUserStore();

const openChat = async () => {
    if (userStore.user) {
        const currentUser = {
            _id: userStore.user._id,
            username: userStore.user.username,
        };
        const otherUser = {
            _id: props.userId,
            username: props.username,
        };
        await chatStore.createOrGetRoom(currentUser, otherUser);
        chatStore.toggleChat();
    }
};
</script>