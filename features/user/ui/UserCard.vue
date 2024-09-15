<template>
    <div class="rounded-lg p-4 flex flex-col h-full">
        <div class="flex items-start justify-between mb-2">
            <div class="flex items-center">
                <UAvatar :src="getUserAvatar(user)" :alt="user.username" class="mr-3" size="sm" />
                <div>
                    <p class="font-semibold ">{{ user.username }}</p>
                    <p class="text-xs">{{ t('rating') }}: {{ user.rating }}</p>
                </div>
            </div>
            <UBadge :color="user.isOnline ? 'green' : 'gray'" class="text-xs px-2 py-1">
                {{ user.isOnline ? t('online') : t('offline') }}
            </UBadge>
        </div>
        <div class="text-xs mb-2">
            <p>{{ t('gamesPlayed') }}: {{ user.gamesPlayed }}</p>
            <p>{{ t('winRate') }}: {{ calculateWinRate(user) }}%</p>
        </div>
        <div class="flex flex-wrap gap-2 mt-auto">
            <UButton v-if="canInvite" @click="inviteToGame" color="violet" variant="soft" icon="i-heroicons-envelope"
                size="xs" class="flex-grow">
                {{ t('invite') }}
            </UButton>
            <UButton v-if="canAddFriend" @click="addFriend" color="emerald" variant="soft" icon="i-heroicons-user-plus"
                size="xs" class="flex-grow">
                {{ t('addFriend') }}
            </UButton>
            <ChatButton :username="user.username" :user-id="user._id" class="flex-grow" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useInvitationStore } from '~/store/invitation';
import { useFriendsStore } from '~/store/friends';
import ChatButton from '~/features/chat/ui/ChatButton.vue';
const { t } = useI18n()
const invitationStore = useInvitationStore();
const friendsStore = useFriendsStore();

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

function getUserAvatar(user: any) {
    return '';
}

function calculateWinRate(user: any) {
    if (user.gamesPlayed === 0) return 0;
    return ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1);
}
</script>

<style scoped>
.UButton {
    @apply justify-center;
}
</style>