<!-- features/user-list/UserList.vue -->
<template>

    <UCard class="user-list">
        <template #header>
            <h2 class="text-xl font-bold">Players</h2>
            <SortingPlayers></SortingPlayers>
        </template>
        <ul class="space-y-4">
            <li v-for="user in userStore.filteredUsersList" :key="user._id" class="p-4">
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center space-x-4">
                        <UAvatar :src="getUserAvatar(user)" :alt="user.username" />
                        <div>
                            <p class="font-semibold">{{ user.username }}</p>
                            <p class="text-sm text-gray-500">Rating: {{ user.rating }}</p>
                            <p class="text-sm text-gray-500">Games played: {{ user.gamesPlayed }}</p>
                            <p class="text-sm text-gray-500">Win rate: {{ calculateWinRate(user) }}%</p>
                        </div>
                    </div>
                    <div class="flex flex-col items-end space-y-2">
                        <UBadge :color="user.isOnline ? 'green' : 'gray'" class="w-20 flex justify-center">
                            {{ user.isOnline ? 'Online' : 'Offline' }}
                        </UBadge>
                        <UBadge v-if="user.isGame" color="blue" class="w-20 flex justify-center">In Game</UBadge>
                        <UButton v-if="user.isOnline && !user.isGame && user._id !== currentUserId"
                            @click="inviteToGame(user._id)" color="violet" variant="solid" size="sm">
                            Invite to game
                        </UButton>
                    </div>
                </div>
            </li>
        </ul>
    </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '~/store/user';
import SortingPlayers from './SortingPlayers.vue';
const userStore = useUserStore();
const usersList = computed(() => userStore.usersList);
const filteredUsers = computed(() => userStore.filteredUsersList);
const currentUserId = computed(() => userStore.user?._id);

function inviteToGame(inviteeId: string) {
    userStore.sendGameInvitation(inviteeId);
}

function getUserAvatar(user: any) {
    return ''
}

function calculateWinRate(user: any) {
    if (user.gamesPlayed === 0) return 0;
    return ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1);
}
watch(filteredUsers, (newValue) => {
    console.log('filteredUsers changed:', newValue);
}, { deep: true });
</script>

<style scoped>
.user-list {
    max-width: 600px;
    margin: 0 auto;
}
</style>