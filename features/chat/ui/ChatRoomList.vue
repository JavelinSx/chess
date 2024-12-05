<!-- ChatRoomList.vue -->
<template>
    <div ref="roomsContainer" class="h-full overflow-y-auto" @scroll="handleScroll">
        <UAlert v-if="error" color="red" :title="t('chat.error')" :text="error" class="m-4" />

        <div v-if="rooms.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
            <TransitionGroup name="list" tag="div">
                <div v-for="room in rooms" :key="room._id"
                    class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    @click="setActiveRoom(String(room._id))">
                    <div class="flex justify-between items-start">
                        <div class="flex items-center gap-3">
                            <UAvatar :ui="{
                                rounded: 'object-cover'
                            }" :src="getOtherParticipant(room)?.avatar" :alt="getOtherParticipant(room)?.username" size="sm" />
                            <div>
                                <h3 class="font-medium">
                                    {{ getOtherParticipant(room)?.username }}
                                </h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400 truncate w-40">
                                    {{ room.lastMessage?.content }}
                                </p>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                {{ formatDate(room.lastMessageAt) }}
                            </span>
                            <UBadge v-if="room.unreadCount" color="primary" size="sm">
                                {{ room.unreadCount }}
                            </UBadge>
                        </div>
                    </div>
                </div>
            </TransitionGroup>
        </div>
        <div v-else class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <UIcon name="i-heroicons-chat-bubble-left" class="h-12 w-12 mb-2" />
            <p>{{ t('chat.noChatRoomsAvailable') }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ChatRoom } from '~/server/services/chat/types';
import { useChatStore } from '~/stores/chat';

const { t } = useI18n();
const roomsContainer = ref<HTMLElement>();
const error = ref<string | null>(null);
const chatStore = useChatStore();
const userStore = useUserStore();

interface ExtendedChatRoom extends ChatRoom {
    unreadCount?: number;
    _id: string;
}

const handleScrollEvent = (e: Event) => {
    handleScroll(e);
};

const handleRoomClick = (roomId: string) => {
    setActiveRoom(roomId);
};

const handleScroll = (e: Event) => {
    // Implement scroll logic if needed
};

const rooms = computed<ExtendedChatRoom[]>(() =>
    chatStore.sortedRooms.map(room => ({
        ...room,
        _id: String(room._id)
    }))
);

const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find(p => p.userId !== userStore.user?._id);
};

const setActiveRoom = async (roomId: string) => {
    try {
        await chatStore.setActiveRoom(roomId);
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Unknown error';
    }
};

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};
</script>