<!-- FloatingChat.vue -->
<template>
    <div v-if="chatStore.isOpen"
        class="fixed z-30 bottom-4 right-4 w-80 lg:w-96 h-[600px] shadow-lg rounded-lg flex flex-col bg-slate-50 dark:bg-slate-800">
        <header class="p-4 rounded-t-lg flex justify-between items-center border-b dark:border-gray-700">
            <h2 class="text-lg font-semibold">
                {{ activeRoomId ? otherParticipant?.username : t('chat.chatTitle') }}
            </h2>
            <div class="flex gap-2">
                <UButton v-if="activeRoomId" icon="i-heroicons-arrow-left" @click="backToRoomList" color="gray"
                    variant="ghost" />
                <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="closeChat" />
            </div>
        </header>

        <Suspense>
            <main class="flex-grow overflow-hidden">
                <ChatRoomList v-if="!activeRoomId" />
                <ChatRoom v-else />
            </main>
            <template #fallback>
                <div class="flex h-full items-center justify-center">
                    <Suspense>
                        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8" />
                    </Suspense>
                </div>
            </template>
        </Suspense>
    </div>
</template>

<script setup lang="ts">
import ChatRoom from './ChatRoom.vue';
import ChatRoomList from './ChatRoomList.vue';
import { useChatStore } from '~/stores/chat';
const { t } = useI18n();
const chatStore = useChatStore();
const { activeRoomId } = storeToRefs(chatStore);
const { isOpen } = storeToRefs(chatStore)


watch(isOpen, async () => {
    if (chatStore.isOpen) {
        await chatStore.fetchRooms()
    }
})

const otherParticipant = computed(() => {
    if (!chatStore.currentRoom) return null;
    return chatStore.currentRoom.participants.find(
        p => p.userId !== chatStore.currentUserId
    );
});

const backToRoomList = () => {
    chatStore.setActiveRoom(null);
};

const closeChat = () => {
    chatStore.closeChat();
};

onBeforeUnmount(() => {
    chatStore.closeChat();
});
</script>