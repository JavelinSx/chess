<template>
    <UCard>
        <UAccordion :items="accordionItems" :ui="accordionUI">
            <template #default="{ open, toggle }">
                <UButton class="w-full flex justify-between items-center" color="gray" variant="ghost" @click="toggle">
                    <span>Friends ({{ onlineFriendsCount }} online)</span>
                    <UIcon :name="open ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" />
                </UButton>
            </template>
            <template #item="{ item }">
                <div v-if="friends.length > 0" class="space-y-4">
                    <UCard v-for="friend in friends" :key="friend._id" class="pt-6 lg:w-60 relative">
                        <div class="flex flex-col items-center justify-between gap-4 ">
                            <UBadge :color="friend.isOnline ? 'green' : 'gray'" size="sm"
                                class="absolute top-3 right-3">
                                {{ friend.isOnline ? 'Online' : 'Offline' }}
                            </UBadge>
                            <div class="flex items-center space-x-4">
                                <UAvatar :src="getUserAvatar(friend._id)" :alt="getUserUsername(friend._id)" />

                                <p class="font-semibold">{{ getUserUsername(friend._id) }}</p>

                            </div>
                            <div class="flex space-x-2">

                                <UButton v-if="canInvite(friend)" @click="inviteToGame(friend._id)" color="violet"
                                    variant="soft" icon="i-heroicons-envelope">
                                    Invite
                                </UButton>
                                <UButton color="red" variant="soft" icon="i-heroicons-user-minus"
                                    @click="removeFriend(friend._id)">
                                    Remove
                                </UButton>
                            </div>
                        </div>
                    </UCard>
                </div>
                <p v-else class="text-center text-gray-500">You have no friends yet.</p>
            </template>
        </UAccordion>
    </UCard>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useFriendsStore } from '~/store/friends';
import { useUserStore } from '~/store/user';
import { useInvitationStore } from '~/store/invitation';
import { storeToRefs } from 'pinia';

const friendsStore = useFriendsStore();
const userStore = useUserStore();
const invitationStore = useInvitationStore();
const { friends } = storeToRefs(friendsStore);
const { usersList } = storeToRefs(userStore);
const { user } = storeToRefs(userStore);

const onlineFriendsCount = computed(() => friends.value.filter(friend => friend.isOnline).length);

const accordionItems = computed(() => [
    {
        label: `Friends (${onlineFriendsCount.value} online)`,
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

const canInvite = (friend: any) => {
    return friend.isOnline && !friend.isGame && friend._id !== user.value?._id;
};

function inviteToGame(friendId: string) {
    invitationStore.sendGameInvitation(friendId);
}

onMounted(async () => {
    await friendsStore.fetchFriends();
    await userStore.fetchUsersList();
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
    return user ? `https://avatar.example.com/${user.username}` : '';
}
</script>