<template>
    <UAccordion v-if="receivedRequests.length > 0" :items="accordionItem" class="mb-4">
        <template #default="{ open, toggle }">
            <UButton class="w-full flex justify-between items-center" color="gray" variant="ghost" @click="toggle">
                <span>Friend Requests ({{ receivedRequests.length }})</span>
                <UIcon :name="open ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" />
            </UButton>
        </template>
        <template #item>
            <div v-if="receivedRequests.length > 0" class="space-y-4">
                <UCard v-for="request in receivedRequests" :key="request._id" class="p-4 ">
                    <div class="flex flex-col gap-4 items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <UAvatar :src="getUserAvatar(request.from)" :alt="getUserUsername(request.from)" />
                            <p class="font-semibold">{{ getUserUsername(request.from) }} wants to be
                                your friend</p>
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
            <p v-else class="text-center">No pending friend requests.</p>
        </template>
    </UAccordion>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useFriendsStore } from '~/store/friends';
import { useUserStore } from '~/store/user';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const friendsStore = useFriendsStore();
const { receivedRequests, isLoading, error } = storeToRefs(friendsStore);

const accordionItem = computed(() => [
    {
        label: `Friend Requests (${receivedRequests.value.length})`,
        content: '',
        defaultOpen: true,
    }
]);

onMounted(() => {
    friendsStore.fetchFriendRequests();
});

const respondToRequest = (requestId: string, accept: boolean) => {
    friendsStore.respondToFriendRequest(requestId, accept);
};

function getUserAvatar(userId: string): string {
    return `https://avatar.example.com/${userId}`;
}

function getUserName(userId: string): string {
    console.log(userId)
    const user = userStore.usersList.find((user) => user._id === userId);
    return user ? user.username : 'Unknown User';
}
</script>