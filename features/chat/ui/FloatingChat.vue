<!-- FloatingChat.vue -->
<template>
    <div v-if="chatStore.isOpen"
        class="fixed bottom-4 right-4 w-80 h-96 shadow-lg rounded-lg flex flex-col bg-slate-50 dark:bg-slate-800">
        <div class="p-4 rounded-t-lg flex justify-between items-center">
            <h2 class="text-lg font-semibold">{{ t('chatTitle') }}</h2>
            <UButton v-if="chatStore.activeRoomId" icon="i-heroicons-arrow-left" @click="backToRoomList" color="gray"
                variant="ghost" class="hover" />
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="closeChat" class="hover" />
        </div>
        <div class="flex-grow overflow-hidden">
            <ChatRoomList v-if="!chatStore.activeRoomId" />
            <ChatMessages v-else />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import ChatRoomList from '~/features/chat/ui/ChatRoomList.vue';
import ChatMessages from '~/features/chat/ui/ChatMessages.vue';
import { useChatStore } from '~/store/chat';
import { useUserStore } from '~/store/user';
const { t } = useI18n();
const chatStore = useChatStore();
const userStore = useUserStore();

const backToRoomList = () => {
    chatStore.setActiveRoom(null);
};

const closeChat = () => {
    chatStore.closeChat();
};

onMounted(() => {
    if (userStore.user) {
        chatStore.currentUserId = userStore.user._id;
        chatStore.fetchRooms();
    }
});

onUnmounted(() => {
    chatStore.closeChat();
});
</script>