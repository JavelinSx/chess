<template>
    <UCard class="user-list h-full w-full" :ui="{
        base: 'h-full w-full',
        body: {
            base: 'h-full w-full',
            background: '',
            padding: 'px-4 py-5 sm:p-4',
        },
    }">
        <template #header>
            <h2 class="text-xl font-bold mb-4">Players</h2>
            <SortingPlayers />
        </template>
        <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <li v-if="paginatedUsers.length > 0" v-for="user in paginatedUsers" :key="user._id">
                <UserCard :user="user" :current-user-id="currentUserId" @invite="inviteToGame" />
            </li>
            <div class="col-span-3 text-center mt-10 mb-10" v-else> Players not found </div>
        </ul>
        <div class="mt-4 flex justify-center" v-if="paginatedUsers.length > 0">
            <UPagination v-model="currentPage" :total="totalUsers" :per-page="itemsPerPage" :ui="{}">
                <template #prev="{ onClick }">
                    <UTooltip text="Previous page">
                        <UButton icon="i-heroicons-arrow-small-left-20-solid" color="primary" @click="onClick"
                            class="mr-2" />
                    </UTooltip>
                </template>
                <template #next="{ onClick }">
                    <UTooltip text="Next page">
                        <UButton icon="i-heroicons-arrow-small-right-20-solid" color="primary" @click="onClick"
                            class="ml-2" />
                    </UTooltip>
                </template>
            </UPagination>
        </div>
        <div class="mt-2 text-sm text-gray-500">
            Page {{ currentPage }} of {{ totalPages }}
            ({{ paginatedUsers.length }} users shown, {{ totalUsers }} total)
        </div>
    </UCard>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useUserStore } from '~/store/user';
import SortingPlayers from './SortingPlayers.vue';
import UserCard from '../user/ui/UserCard.vue';

const userStore = useUserStore();
const currentUserId = computed(() => userStore.user?._id);

const paginatedUsers = computed(() => userStore.paginatedUsers);
const totalUsers = computed(() => userStore.totalUsers);
const totalPages = computed(() => userStore.totalPages);
const itemsPerPage = computed(() => userStore.itemsPerPage);
const currentPage = computed({
    get: () => userStore.currentPage,
    set: (value) => userStore.setCurrentPage(value),
});

function inviteToGame(inviteeId: string) {
    userStore.sendGameInvitation(inviteeId);
}

onMounted(async () => {
    console.log('UserList mounted');
    console.log('Initial itemsPerPage:', userStore.itemsPerPage);
    await userStore.fetchUsersList();
    console.log('After fetchUsersList');
    console.log('itemsPerPage:', userStore.itemsPerPage);
    console.log('Total users:', totalUsers.value);
    console.log('Paginated users:', paginatedUsers.value.length);
    console.log('Total pages:', totalPages.value);
});
</script>

<style scoped>
.user-list {
    max-width: 1200px;
    margin: 0 auto;
}
</style>