<template>
    <div class="rounded-lg p-4 flex flex-col h-full">
        <div class="flex items-start justify-between mb-2">
            <div class="flex items-center">
                <UAvatar :src="getUserAvatar(user)" :alt="user.username" class="mr-3" size="sm" />
                <div>
                    <p class="font-semibold">{{ user.username }}</p>
                    <p class="text-xs">{{ t('profile.rating') }}: {{ user.rating }}</p>
                </div>
            </div>
            <UBadge :color="user.isOnline ? 'green' : 'gray'" class="text-xs px-2 py-1">
                {{ user.isOnline ? t('common.online') : t('common.offline') }}
            </UBadge>
        </div>
        <div class="text-xs mb-2">
            <p>{{ t('profile.gamesPlayed') }}: {{ user.stats.gamesPlayed }}</p>
            <p>{{ t('profile.winRate') }}: {{ calculateWinRate(user) }}%</p>
        </div>
        <div class="flex flex-wrap gap-2 mt-auto">
            <InviteButton :user-id="user._id" />
            <UButton v-if="canAddFriend" @click="addFriend" color="emerald" variant="soft" icon="i-heroicons-user-plus"
                class="flex-grow">
                {{ t('friends.addFriend') }}
            </UButton>
            <ChatButton :username="user.username" :user-id="user._id" :chat-setting="user.chatSetting"
                class="flex-grow" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useInvitationStore } from '~/store/invitation';
import { useFriendsStore } from '~/store/friends';
import ChatButton from '~/features/chat/ui/ChatButton.vue';
import InviteButton from '~/features/invite/InviteButton.vue';
import type { ClientUser } from '~/server/types/user';

const { t } = useI18n();
const friendsStore = useFriendsStore();

const props = defineProps<{
    user: ClientUser;
    currentUserId: string | undefined;
}>();

const canAddFriend = computed(() => {
    if (!props.currentUserId || !Array.isArray(friendsStore.friends)) {
        return false;
    }
    const isCurrentUser = props.user._id === props.currentUserId;
    const isAlreadyFriend = friendsStore.friends.some(friend => friend._id === props.user._id);
    return !isCurrentUser && !isAlreadyFriend;
});

function addFriend() {
    friendsStore.sendFriendRequest(props.user._id);
}

function getUserAvatar(user: ClientUser) {
    return ''; // Реализуйте логику получения аватара, если необходимо
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