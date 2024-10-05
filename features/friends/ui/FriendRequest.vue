<template>
    <UAccordion :items="accordionItem" class="mb-4">
        <template #default="{ open, toggle }">
            <UButton class="w-full flex justify-between items-center" color="gray" variant="ghost" @click="toggle">
                <span>{{ t('friends.friendRequests') }} ({{ receivedRequests.length }})</span>
                <UIcon :name="open ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" />
            </UButton>
        </template>
        <template #item>
            <div v-if="receivedRequests.length > 0" class="space-y-4">
                <UCard v-for="request in receivedRequests" :key="request._id" class="p-4">
                    <div class="flex flex-col gap-4 items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <p class="font-semibold">{{ getUsernameById(request.from) }} {{
                                t('friends.wantsToBeYourFriend') }}
                            </p>
                        </div>
                        <div class="flex space-x-2">
                            <UButton color="green" variant="soft" icon="i-heroicons-check"
                                @click="respondToRequest(request._id, true)">
                                {{ t('common.accept') }}
                            </UButton>
                            <UButton color="red" variant="soft" icon="i-heroicons-x-mark"
                                @click="respondToRequest(request._id, false)">
                                {{ t('common.decline') }}
                            </UButton>
                        </div>
                    </div>
                </UCard>
            </div>
            <p v-else class="text-center">{{ t('friends.noPendingFriend') }}</p>
        </template>
    </UAccordion>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useFriendsStore } from '~/store/friends';
import { useUserStore } from '~/store/user';
import { storeToRefs } from 'pinia';
const { t } = useI18n()
const friendsStore = useFriendsStore();
const userStore = useUserStore();
const { receivedRequests } = storeToRefs(friendsStore);
const { usersList } = storeToRefs(userStore);


const accordionItem = computed(() => [{
    label: `${t('friends.friendRequests')} (${receivedRequests.value.length})`,
    content: '',
    defaultOpen: true,
}]);


const respondToRequest = async (requestId: string, accept: boolean) => {
    await friendsStore.respondToFriendRequest(requestId, accept);
};

const getUsernameById = (userId: string): string => {
    const user = usersList.value.find(u => u._id === userId);
    return user ? user.username : 'Unknown User';
};


</script>