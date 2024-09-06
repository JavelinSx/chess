<!-- features/chat/ui/ChatRoomList.vue -->
<template>
    <div class="h-full overflow-y-auto p-4">
        <ul>
            <li v-for="room in chatStore.sortedRooms" :key="room._id.toString()" @click="openRoom(room._id.toString())"
                class="cursor-pointer text-blue-400 hover:bg-gray-100 p-2 rounded">
                <div class="flex items-center">
                    <UAvatar :src="getOtherUserAvatar(room)" :alt="getOtherUsername(room)" class="mr-2" />
                    <div>
                        <p class="font-semibold">{{ getOtherUsername(room) }}</p>
                        <p class="text-sm text-gray-500">{{ getLastMessage(room) }}</p>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useChatStore } from '~/store/chat';
import type { IChatRoom } from '~/server/types/chat';

const chatStore = useChatStore();

onMounted(async () => {
    await chatStore.fetchRooms();
});

const openRoom = (roomId: string) => {
    chatStore.setActiveRoom(roomId);
};

const getOtherUsername = (room: IChatRoom) => {
    const otherUser = room.participants.find(p => p._id.toString() !== chatStore.currentUserId);
    return otherUser ? otherUser.username : 'Unknown User';
};

const getOtherUserAvatar = (room: IChatRoom) => {
    const otherUser = room.participants.find(p => p._id.toString() !== chatStore.currentUserId);
    return otherUser ? `https://avatar.example.com/${otherUser.username}` : '';
};

const getLastMessage = (room: IChatRoom) => {
    const lastMessage = room.messages[room.messages.length - 1];
    return lastMessage ? lastMessage.content.substring(0, 20) + '...' : 'No messages yet';
};
</script>