<template>
    <div v-if="chatStore.isOpen" class="fixed bottom-4 right-4 w-80 h-96 bg-white shadow-lg rounded-lg flex flex-col">
        <div class="p-4 bg-gray-500 rounded-t-lg flex justify-between items-center">
            <h2 class="text-lg font-semibold">{{ chatTitle }}</h2>
            <UButton icon="i-heroicons-arrow-left" v-if="chatStore.activeRoomId" @click="backToRoomList" color="gray"
                variant="ghost" />
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="chatStore.closeChat" />
        </div>
        <div class="flex-grow overflow-hidden">
            <ChatRoomList v-if="!chatStore.activeRoomId" />
            <ChatMessages v-else />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ChatRoomList from '~/features/chat/ui/ChatRoomList.vue';
import ChatMessages from '~/features/chat/ui/ChatMessages.vue';
import { useChatStore } from '~/store/chat';

const chatStore = useChatStore();

const chatTitle = computed(() => {
    if (chatStore.activeRoomId) {
        const otherUser = chatStore.activeRoom?.participants.find(p => p._id.toString() !== chatStore.currentUserId);
        return otherUser ? otherUser.username : 'Chat';
    }
    return 'Chats';
});

const backToRoomList = () => {
    chatStore.setActiveRoom(null);
};
</script>