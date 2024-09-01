<template>
    <UCard class="w-full max-w-sm">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
            <div class="flex items-center mb-4 sm:mb-0">
                <UAvatar :src="getUserAvatar(user)" :alt="user.username" class="mr-4" />
                <div>
                    <p class="font-semibold">{{ user.username }}</p>
                    <p class="text-sm text-gray-500">Rating: {{ user.rating }}</p>
                    <p class="text-sm text-gray-500">Games played: {{ user.gamesPlayed }}</p>
                    <p class="text-sm text-gray-500">Win rate: {{ calculateWinRate(user) }}%</p>
                </div>
            </div>

            <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <UBadge :color="user.isOnline ? 'green' : 'gray'" class="w-20 flex justify-center">
                    {{ user.isOnline ? 'Online' : 'Offline' }}
                </UBadge>
                <UBadge v-if="user.isGame" color="blue" class="w-20 flex justify-center">In Game</UBadge>
                <UButton v-if="canInvite" @click="inviteToGame" color="violet" variant="soft"
                    icon="i-heroicons-envelope">
                    Invite
                </UButton>
                <UButton v-if="canAddFriend" @click="addFriend" color="emerald" variant="soft"
                    icon="i-heroicons-user-plus">
                    Add Friend
                </UButton>
                <UButton @click="startChat" color="blue" variant="soft" icon="i-heroicons-chat-bubble-left-right">
                    Chat
                </UButton>
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useInvitationStore } from '~/store/invitation';
import { useFriendsStore } from '~/store/friends';
import { useChatStore } from '~/store/chat';

const invitationStore = useInvitationStore();
const friendsStore = useFriendsStore();
const chatStore = useChatStore();

const props = defineProps<{
    user: any;
    currentUserId: string | undefined;
}>();

const canInvite = computed(() => {
    return props.user.isOnline && !props.user.isGame && props.user._id !== props.currentUserId;
});

const canAddFriend = computed(() => {
    return props.user._id !== props.currentUserId && !friendsStore.friends.some(friend => friend._id === props.user._id);
});

function inviteToGame() {
    invitationStore.sendGameInvitation(props.user._id);
}

function addFriend() {
    friendsStore.sendFriendRequest(props.user._id);
}

function startChat() {
    chatStore.openChat(props.user._id);
}

function getUserAvatar(user: any) {
    return `https://avatar.example.com/${user.username}`;
}

function calculateWinRate(user: any) {
    if (user.gamesPlayed === 0) return 0;
    return ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1);
}
</script>