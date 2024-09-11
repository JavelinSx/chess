<template>
    <UCard class="user-list h-full w-full" :ui="{
        base: 'h-full w-full',
        body: {
            base: 'h-full w-full',
            background: '',
            padding: 'px-4 py-5 sm:p-6',
        },
    }">
        <template #header>
            <h2 class="text-xl font-bold mb-4">Players</h2>
            <SortingPlayers />
        </template>
        <UCard class="mb-4">
            <FriendsList></FriendsList>
            <FriendRequest></FriendRequest>
        </UCard>

        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            <li v-if="paginationStore.paginatedUsers.length > 0" v-for="user in paginationStore.paginatedUsers"
                :key="user._id">
                <UserCard :user="user" :current-user-id="currentUserId" @invite="inviteToGame" />
            </li>
            <li v-else class="col-span-full text-center mt-10 mb-10">
                Players not found
            </li>
        </ul>
        <Pagination />
    </UCard>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useUserStore } from '~/store/user';
import { usePaginationStore } from '~/store/pagination';
import { useInvitationStore } from '~/store/invitation';
import SortingPlayers from './SortingPlayers.vue';
import UserCard from '../user/ui/UserCard.vue';
import Pagination from './Pagination.vue';
import FriendsList from '../friends/ui/FriendsList.vue';
import FriendRequest from '../friends/ui/FriendRequest.vue';

const userStore = useUserStore();
const paginationStore = usePaginationStore();
const invitationStore = useInvitationStore();

const currentUserId = computed(() => userStore.user?._id);

function inviteToGame(inviteeId: string) {
    invitationStore.sendGameInvitation(inviteeId);
}

onMounted(async () => {
    await userStore.fetchUsersList();
});
</script>

<style scoped>
.user-list {
    max-width: 1400px;
    margin: 0 auto;
}
</style>