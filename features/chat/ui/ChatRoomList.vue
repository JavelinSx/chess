<!-- ChatRoomList.vue -->
<template>
    <div ref="roomsContainer" class="h-full overflow-y-auto">
        <UAlert v-if="chatStore.error" color="red" :title="t('chat.error')" :text="chatStore.error" class="m-4" />

        <div v-if="sortedRooms.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
            <div v-for="room in sortedRooms" :key="room._id"
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                @click="chatStore.openRoom(String(room._id))">

                <div class="flex justify-between items-start relative">
                    <div class="flex items-center gap-3">
                        <UAvatar :alt="getOtherParticipant(room)?.username" size="sm"
                            :ui="{ rounded: 'rounded-full' }" />
                        <div>
                            <h3 class="font-medium max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis">
                                {{ getOtherParticipant(room)?.username }}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 truncate w-40">
                                {{ room.lastMessage?.content }}
                            </p>
                        </div>
                    </div>
                    <UButton class="mt-2" color="red" variant="ghost" icon="i-heroicons-trash"
                        @click.stop="roomToDelete = room" />
                    <span class="text-xs text-gray-500 dark:text-gray-400 absolute right-0 -top-3">
                        {{ formatDate(room.lastMessageAt) }}
                    </span>
                    <!-- Показываем количество непрочитанных, если есть -->
                    <span v-if="getUnreadCount(room) > 0" class="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                        {{ getUnreadCount(room) }}
                    </span>
                </div>

            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <UIcon name="i-heroicons-chat-bubble-left" class="h-12 w-12 mb-2" />
            <p>{{ t('chat.noChatRoomsAvailable') }}</p>
        </div>
    </div>
    <ChatDeleteModal :is-open="!!roomToDelete" :loading="isDeleting" @confirm="handleDeleteConfirm"
        @close="roomToDelete = null" />
</template>

<script setup lang="ts">
import type { ChatRoom } from '~/server/services/chat/types';
import { useChatStore } from '~/stores/chat';
import ChatDeleteModal from './ChatDeleteModal.vue';
const { t } = useI18n();
const chatStore = useChatStore();
const userStore = useUserStore();
const { sortedRooms } = storeToRefs(chatStore);
const isDeleting = ref(false);
const roomToDelete = ref<ChatRoom | null>(null);

const handleDeleteConfirm = async () => {
    if (!roomToDelete.value) return;

    isDeleting.value = true;
    try {
        await chatStore.deleteRoom(roomToDelete.value._id);
        roomToDelete.value = null;
    } finally {
        isDeleting.value = false;
    }
};

const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find(p => p.userId !== userStore.user?._id);
};

const getUnreadCount = (room: ChatRoom) => {
    const currentUserParticipant = room.participants.find(p => p.userId === userStore.user?._id);
    return currentUserParticipant?.unreadCount || 0;
};

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};
</script>