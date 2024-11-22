<template>
    <UCard :ui="{
        base: 'h-full w-full',
        header: 'px-0 py-0 sm:px-0',
        ring: user.isOnline
            ? 'ring-1 ring-green-500 dark:ring-green-400'
            : 'ring-1 ring-gray-200 dark:ring-gray-700',
    }">
        <template #header>
            <div class="flex items-center justify-between cursor-pointer px-4 py-5 md:px-6"
                @click="navigateToUserProfile">
                <UCard :ui="{ base: 'w-full' }">
                    <div class="flex justify-between">
                        <div class="flex flex-col items-center gap-2">
                            <UAvatar :src="getUserAvatar(user)" :alt="user.username" size="lg" />
                            <p class="font-semibold">{{ user.username }}</p>
                        </div>
                        <div class="flex flex-col items-center gap-2">
                            <TitleIcon :rating="user.rating" />
                            <p>{{ t('profile.rating') }}: {{ user.rating }}</p>
                        </div>
                    </div>
                </UCard>
            </div>
        </template>
        <ClientOnly>
            <div class="flex flex-col h-full w-full justify-between font-normal text-sm">
                <div class="flex flex-col gap-2 mt-4">
                    <InviteButton :user-id="user._id" :disabled="user.isOnline" />
                    <UButton v-if="canAddFriend" @click="addFriend" color="emerald" variant="soft"
                        icon="i-heroicons-user-plus" class="flex-grow">
                        {{ t('friends.addFriend') }}
                    </UButton>
                    <ChatButton :username="user.username" :user-id="user._id" :chat-setting="user.chatSetting"
                        class="flex-grow" />
                </div>
            </div>
        </ClientOnly>
        <template #footer v-if="isInFriendList">
            <UButton color="red" variant="soft" icon="i-heroicons-user-minus" class="w-full"
                @click="removeFriend(user._id)">
                {{ t('friends.removeFriend') }}
            </UButton>
        </template>
    </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFriendsStore } from '~/store/friends';
import ChatButton from '~/features/chat/ui/ChatButton.vue';
import InviteButton from '~/features/invite/InviteButton.vue';
import TitleIcon from '~/features/profile/ui/TitleIcon.vue';
import type { ClientUser } from '~/server/types/user';


const { t } = useI18n();
const friendsStore = useFriendsStore();

const props = defineProps<{
    user: ClientUser;
    currentUserId: string | undefined;
    isInFriendList?: boolean;
}>();

const canAddFriend = computed(() => {
    if (!props.currentUserId || !Array.isArray(friendsStore.friends)) {
        return false;
    }
    const isCurrentUser = props.user._id === props.currentUserId;
    const isAlreadyFriend = friendsStore.friends.some(friend => friend._id === props.user._id);
    return !isCurrentUser && !isAlreadyFriend && !props.isInFriendList;
});

function addFriend() {
    friendsStore.sendFriendRequest(props.user._id);
}

function removeFriend(friendId: string) {
    friendsStore.removeFriend(friendId);
}

function navigateToUserProfile() {
    navigateTo(`/user/${props.user._id}`);
}

function getUserAvatar(user: ClientUser) {
    return user.avatar;
}

function calculateWinRate(user: ClientUser) {
    if (user.stats.gamesPlayed === 0) return 0;
    return ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1);
}
</script>

<style scoped>
.UButton {
    @apply justify-center;
}
</style>