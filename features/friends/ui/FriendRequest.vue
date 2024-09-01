<template>
    <UCard>
        <UAccordion :items="[accordionItem]">
            <template #default="{ open, toggle }">
                <UButton class="w-full flex justify-between items-center" color="gray" variant="ghost" @click="toggle">
                    <span>Friend Requests ({{ receivedRequests.length }})</span>
                    <UIcon :name="open ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" />
                </UButton>
            </template>
            <template #content>
                <div v-if="receivedRequests.length > 0" class="space-y-4">
                    <UCard v-for="request in receivedRequests" :key="request._id" class="p-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <UAvatar :src="getUserAvatar(request.from)" :alt="getUserUsername(request.from)" />
                                <p class="font-semibold">{{ getUserUsername(request.from) }} wants to be your friend</p>
                            </div>
                            <div class="flex space-x-2">
                                <UButton color="green" variant="soft" icon="i-heroicons-check"
                                    @click="respondToRequest(request._id, true)">
                                    Accept
                                </UButton>
                                <UButton color="red" variant="soft" icon="i-heroicons-x-mark"
                                    @click="respondToRequest(request._id, false)">
                                    Reject
                                </UButton>
                            </div>
                        </div>
                    </UCard>
                </div>
                <p v-else class="text-center text-gray-500">No pending friend requests.</p>
            </template>
        </UAccordion>
    </UCard>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useFriendsStore } from '~/store/friends';
import { useUserStore } from '~/store/user';
import { storeToRefs } from 'pinia';

const friendsStore = useFriendsStore();
const userStore = useUserStore();
const { receivedRequests } = storeToRefs(friendsStore);
const { usersList } = storeToRefs(userStore);

const accordionItem = computed(() => ({
    label: `Friend Requests (${receivedRequests.value.length})`,
    content: '',
    defaultOpen: true,
}));

onMounted(() => {
    friendsStore.fetchFriendRequests();
    userStore.fetchUsersList();
});

const respondToRequest = (requestId: string, accept: boolean) => {
    friendsStore.respondToFriendRequest(requestId, accept);
};

function getUserUsername(userId: string): string {
    const user = usersList.value.find(u => u._id === userId);
    return user ? user.username : 'Unknown User';
}

function getUserAvatar(userId: string): string {
    const user = usersList.value.find(u => u._id === userId);
    return user ? `https://avatar.example.com/${user.username}` : '';
}
</script>