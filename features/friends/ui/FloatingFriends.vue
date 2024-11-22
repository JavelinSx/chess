<template>
    <div v-if="isOpen"
        class="fixed bottom-4 right-4 z-30 w-80 h-96 shadow-lg rounded-lg flex flex-col bg-slate-50 dark:bg-slate-800">
        <div class="p-4 rounded-t-lg flex justify-between items-center">
            <h2 class="text-lg font-semibold">{{ t('friends.friends') }} ({{ onlineFriendsCount }} {{ t('common.online')
                }})</h2>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="closeFriendsList" class="hover" />
        </div>

        <div class="flex-grow overflow-hidden">
            <!-- Friend Requests Section -->
            <div v-if="receivedRequests.length > 0" class="p-4 border-b">
                <h3 class="text-sm font-semibold mb-2">{{ t('friends.friendRequests') }}
                    ({{ receivedRequests.length }})</h3>
                <UCard v-for="request in receivedRequests" :key="request._id" class="mb-2">
                    <div class="flex flex-col gap-2">
                        <p class="text-sm">{{ getUsernameById(request.from) }} {{ t('friends.wantsToBeYourFriend') }}
                        </p>
                        <div class="flex gap-2">
                            <UButton size="xs" color="green" variant="soft"
                                @click="respondToRequest(request._id, true)">
                                {{ t('common.accept') }}
                            </UButton>
                            <UButton size="xs" color="red" variant="soft" @click="respondToRequest(request._id, false)">
                                {{ t('common.decline') }}
                            </UButton>
                        </div>
                    </div>
                </UCard>
            </div>

            <!-- Friends List Section -->
            <div class="overflow-y-auto h-full p-4">
                <div v-if="friendsInUserList.length > 0" class="space-y-3">
                    <div v-for="friend in friendsInUserList" :key="friend._id"
                        class="flex flex-col items-center justify-between p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 gap-3">
                        <div class="flex items-center gap-3 justify-between w-full">
                            <div class="flex flex-row gap-3">
                                <UAvatar :src="friend.avatar" :alt="friend.username" size="lg" />
                                <div class="flex flex-col w-full">
                                    <span class="font-medium">{{ friend.username }}</span>
                                    <span class="text-xs" :class="friend.isOnline ? 'text-green-500' : 'text-gray-500'">
                                        {{ friend.isOnline ? t('common.online') : t('common.offline') }}
                                    </span>
                                </div>
                            </div>

                            <UButton size="lg" color="red" variant="soft" @click="removeFriend(friend._id)"
                                icon="i-heroicons-user-minus" />
                        </div>
                        <div class="flex justify-center w-full gap-2">
                            <UButton v-if="!friend.isGame && friend.isOnline" size="xs" color="purple"
                                @click="inviteToGame(friend)" icon="i-heroicons-play">
                                {{ t('game.invite') }}
                            </UButton>
                            <ChatButton :username="friend.username" :user-id="friend._id"
                                :chat-setting="friend.chatSetting" class="w-28" @click="isOpen = false" />

                        </div>
                    </div>
                </div>
                <p v-else class="text-center text-gray-500">{{ t('friends.noFriends') }}</p>
            </div>
        </div>
    </div>

    <UButton v-if="isAuthenticated && !isOpen" @click="openFriendsList" color="primary" variant="soft" size="xl"
        icon="i-heroicons-user-group" class="fixed w-28 bottom-16 right-4">
        {{ t('friends.friends') }}
        <UBadge v-if="receivedRequests.length > 0" :label="receivedRequests.length" color="red"
            class="absolute -top-2 -right-2" size="sm" />
    </UButton>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFriendsStore } from '~/store/friends';
import { useUserStore } from '~/store/user';
import { useInvitationStore } from '~/store/invitation';
import { storeToRefs } from 'pinia';
import GameDurationSelector from '~/features/game/ui/GameDurationSelector.vue';
import ChatButton from '~/features/chat/ui/ChatButton.vue';

const { t } = useI18n();
const friendsStore = useFriendsStore();
const userStore = useUserStore();
const invitationStore = useInvitationStore();
const { isAuthenticated } = useAuth();
const isOpen = ref(false);

const { friends, receivedRequests } = storeToRefs(friendsStore);
const { usersList } = storeToRefs(userStore);

const friendsInUserList = computed(() =>
    usersList.value.filter(user => friends.value.some(friend => friend._id === user._id))
);

const onlineFriendsCount = computed(() =>
    Array.isArray(friends.value) ? friends.value.filter(friend => friend.isOnline).length : 0
);

const getUsernameById = (userId: string): string => {
    const user = usersList.value.find(u => u._id === userId);
    return user ? user.username : 'Unknown User';
};

const openFriendsList = () => {
    isOpen.value = true;
};

const closeFriendsList = () => {
    isOpen.value = false;
};

const respondToRequest = async (requestId: string, accept: boolean) => {
    await friendsStore.respondToFriendRequest(requestId, accept);
};

const removeFriend = async (friendId: string) => {
    await friendsStore.removeFriend(friendId);
};

const inviteToGame = (friend: any) => {
    invitationStore.showDurationSelectorFor(friend._id);
};

onMounted(async () => {
    await friendsStore.fetchFriends();
});

// Очистка при размонтировании компонента
onBeforeUnmount(() => {
    isOpen.value = false;
});
</script>

<style scoped>
.hover {
    @apply transition-colors duration-200 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700;
}
</style>