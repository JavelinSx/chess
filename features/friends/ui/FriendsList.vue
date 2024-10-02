<template>
    <UAccordion :items="accordionItems" :ui="accordionUI" class="mb-4">
        <template #default="{ open, toggle }">
            <UButton class="w-full flex justify-between items-center" color="gray" variant="ghost" @click="toggle">
                <span>{{ t('friends.friends') }} ({{ onlineFriendsCount }} {{ t('common.online') }})</span>
                <UIcon :name="open ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" />
            </UButton>
        </template>
        <template #item="{ item }">
            <div v-if="friends.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                <UCard v-for="friend in friends" :key="friend._id" class="relative ">
                    <div class="flex flex-col items-center justify-between gap-4 relative">
                        <div class="flex items-center space-x-4 w-full justify-between">
                            <div class="flex items-center gap-3">
                                <UAvatar :src="getUserAvatar(friend._id)" :alt="getUserUsername(friend._id)" />
                                <p class="font-semibold text-lg">{{ getUserUsername(friend._id) }}</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <UBadge :color="friend.isOnline ? 'green' : 'gray'" size="sm">
                                    {{ friend.isOnline ? t('common.online') : t('common.offline') }}
                                </UBadge>
                                <UButton color="red" variant="soft" icon="i-heroicons-user-minus"
                                    @click="removeFriend(friend._id)">
                                </UButton>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 w-full">
                            <InviteButton :user-id="friend._id" />
                            <ChatButton :username="friend.username" :user-id="friend._id"
                                :chat-setting="getChatSetting(friend._id)" class="flex-grow" />
                        </div>
                    </div>
                </UCard>
            </div>
            <p v-else class="text-center">{{ t('friends.noFriends') }}</p>
        </template>
    </UAccordion>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useFriendsStore } from '~/store/friends';
import { useUserStore } from '~/store/user';
import { storeToRefs } from 'pinia';
import ChatButton from '~/features/chat/ui/ChatButton.vue';
import InviteButton from '~/features/invite/InviteButton.vue';

const { t } = useI18n()
const friendsStore = useFriendsStore();
const userStore = useUserStore();
const { friends } = storeToRefs(friendsStore);
const { usersList } = storeToRefs(userStore);


const onlineFriendsCount = computed(() =>
    Array.isArray(friends.value) ? friends.value.filter(friend => friend.isOnline).length : 0
);

const getChatSetting = (id: string) => {
    const user = usersList.value.find((user) => user._id === id)
    return user ? user.chatSetting : 'all';
}

const accordionItems = computed(() => [
    {
        label: `Friends ({onlineFriendsCount.value} online)`,
        content: 'Friends list content',
        defaultOpen: true
    }
]);

const accordionUI = {
    wrapper: 'space-y-4',
    item: {
        wrapper: 'overflow-hidden',
        content: 'mt-4',
    },
};

onMounted(async () => {
    await friendsStore.fetchFriends();
});

const removeFriend = (friendId: string) => {
    friendsStore.removeFriend(friendId);
};

function getUserUsername(userId: string): string {
    const user = usersList.value.find(u => u._id === userId);
    return user ? user.username : 'Unknown User';
}

function getUserAvatar(userId: string): string {
    const user = usersList.value.find(u => u._id === userId);
    return user ? `https://avatar.example.com/{user.username}` : '';
}
</script>