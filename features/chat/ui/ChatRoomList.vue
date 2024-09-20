<template>
    <div class="h-full overflow-y-auto p-4">
        <p v-if="chatStore.isLoading" class="text-center">{{ t('loadingChatRooms') }}</p>
        <template v-else>
            <ul v-if="chatStore.sortedRooms.length > 0">
                <li v-for="room in chatStore.sortedRooms" :key="room._id.toString()"
                    class="cursor-pointer p-2 rounded hover:bg-slate-500 transition">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center" @click="openRoom(room._id.toString())">
                            <UAvatar :src="getOtherUserAvatar(room)" :alt="getOtherUsername(room)" class="mr-2" />
                            <div>
                                <p class="font-semibold">{{ getOtherUsername(room) }}</p>
                                <p class="text-sm">{{ getLastMessage(room) }}</p>
                            </div>
                        </div>
                        <UButton icon="i-heroicons-trash" color="red" variant="ghost"
                            @click.stop="openDeleteConfirmation(room._id.toString())" />
                    </div>
                    <UDivider class="mt-2" />
                </li>
            </ul>
            <p v-else class="text-center text-gray-500">{{ t('noChatRoomsAvailable') }}</p>
        </template>
        <ConfirmationModal v-model="isConfirmationModalOpen" :title="t('deleteRoomTitle')"
            :message="t('deleteRoomMessage')" :confirm-text="t('delete')" :cancel-text="t('cancel')"
            @confirm="deleteRoom" @cancel="cancelDeleteRoom" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useChatStore } from '~/store/chat';
import { useUserStore } from '~/store/user';
import ConfirmationModal from '~/shared/ui/ConfirmationModal.vue';
import type { IChatRoom } from '~/server/types/chat';
const { t } = useI18n();
const chatStore = useChatStore();
const userStore = useUserStore();

onMounted(async () => {
    if (userStore.user) {
        chatStore.currentUserId = userStore.user._id;
        await chatStore.fetchRooms();
    }
});

watch(() => userStore.user, async (newUser) => {
    if (newUser) {
        chatStore.currentUserId = newUser._id;
        await chatStore.fetchRooms();
    }
});

const isConfirmationModalOpen = ref(false);
const roomToDelete = ref<string | null>(null);

const openDeleteConfirmation = (roomId: string) => {
    roomToDelete.value = roomId;
    isConfirmationModalOpen.value = true;
};

const deleteRoom = async () => {
    if (roomToDelete.value) {
        await chatStore.deleteRoom(roomToDelete.value);
        roomToDelete.value = null;
        isConfirmationModalOpen.value = false;
    }
};

const cancelDeleteRoom = () => {
    roomToDelete.value = null;
    isConfirmationModalOpen.value = false;
};

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
    if (room.lastMessage) {
        return room.lastMessage.content.substring(0, 20) + (room.lastMessage.content.length > 20 ? '...' : '');
    }
    return t('noMessageYet');
};
</script>