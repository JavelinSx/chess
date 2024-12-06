<!-- FloatingChat.vue -->
<template>
    <div v-if="chatStore.isOpen"
        class="fixed z-30 bottom-4 right-4 w-80 lg:w-96 h-[450px] shadow-lg rounded-lg flex flex-col bg-slate-50 dark:bg-slate-800">

        <header class="p-4 rounded-t-lg flex justify-between items-center border-b dark:border-gray-700">

            <h2 class="text-lg font-semibold max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis">
                {{ currentRoom ? otherParticipant?.username : t('chat.chatTitle') }}
            </h2>
            <div class="flex gap-2">
                <UButton v-if="currentRoom" icon="i-heroicons-arrow-left" @click="closeRoom" color="gray"
                    variant="ghost" />
                <UButton icon="i-heroicons-x-mark" @click="chatStore.closeChat" color="gray" variant="ghost" />
            </div>
        </header>

        <Suspense>
            <main class="flex-grow overflow-hidden">
                <ChatRoomList v-if="!currentRoom" />
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
import { useChatStore } from '#imports';

const { t } = useI18n();
const chatStore = useChatStore();
const { currentRoom } = storeToRefs(chatStore);

const otherParticipant = computed(() => {
    if (!currentRoom.value) return null;
    return currentRoom.value.participants.find(p => p.userId !== chatStore.currentUserId);
});

const closeRoom = () => {
    chatStore.currentRoom = null;
};

onBeforeUnmount(() => {
    chatStore.closeChat();
});
</script>