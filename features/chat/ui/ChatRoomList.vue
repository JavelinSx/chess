<template>
    <div class="h-full overflow-y-auto p-4">
        <p v-if="chatStore.isLoading" class="text-center">{{ t('chat.loadingChatRooms') }}</p>
        <template v-else>
            <ul v-if="sortedRooms.length > 0">
                <li v-for="room in sortedRooms" :key="room._id.toString()"
                    class="cursor-pointer p-2 rounded hover:bg-slate-500 transition">
                    <div class="flex items-center justify-between" @click="openRoom(room._id.toString())">
                        <div class="flex items-center">
                            <UAvatar :ui="{
                                rounded: 'object-cover'
                            }" :src="getOtherUserAvatar(room)" :alt="getOtherUsername(room)" class="mr-2" />
                            <div>
                                <p class="font-semibold">{{ getOtherUsername(room) }}</p>
                                <p class="text-sm">{{ getLastMessage(room) }}</p>
                            </div>
                        </div>
                        <UButton icon="i-heroicons-trash" color="red" variant="ghost"
                            @click.stop="openDeleteConfirmation(room._id.toString())" />
                        <UBadge v-if="!canInteract(room)" color="red">{{ t('chat.blocked') }}</UBadge>
                    </div>
                    <UDivider class="mt-2" />
                </li>
            </ul>
            <p v-else class="text-center text-gray-500">{{ t('chat.noChatRoomsAvailable') }}</p>
        </template>
        <ConfirmationModal v-model="isConfirmationModalOpen" :title="t('chat.deleteRoomTitle')"
            :message="t('chat.deleteRoomMessage')" :confirm-text="t('chat.delete')" :cancel-text="t('chat.cancel')"
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


const sortedRooms = computed(() => chatStore.sortedRooms);

const isConfirmationModalOpen = ref(false);
const roomToDelete = ref<string | null>(null);

const canInteract = async (room: IChatRoom) => {
    const currentUser = userStore.user;
    const otherParticipant = room.participants.find(p => p._id.toString() !== currentUser?._id);
    if (!currentUser || !otherParticipant) return false;
    return await chatStore.checkCanInteract(currentUser.chatSetting, otherParticipant.chatSetting, otherParticipant._id.toString());
};

const openDeleteConfirmation = (roomId: string) => {
    roomToDelete.value = roomId;
    isConfirmationModalOpen.value = true;
};

const deleteRoom = async () => {
    if (roomToDelete.value) {
        await chatStore.deleteRoom(roomToDelete.value)
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
    console.log(otherUser)
    return otherUser ? otherUser.avatar : '';
};

const getLastMessage = (room: IChatRoom) => {
    if (room.lastMessage && room.lastMessage.content) {
        return room.lastMessage.content.substring(0, 20) + (room.lastMessage.content.length > 20 ? '...' : '');
    }
    return t('chat.noMessageYet');
};
</script>