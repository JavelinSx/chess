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
            <h2 class="text-xl font-bold mb-4">{{ t('userList.onlinePlayers') }}</h2>
            <SortingPlayers />
        </template>


        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            <li v-if="paginationStore.paginatedUsers.length > 0" v-for="user in paginationStore.paginatedUsers"
                :key="user._id">
                <UserCard :user="user" :current-user-id="currentUserId" :is-in-friend-list="false" />
            </li>
            <li v-else class="col-span-full text-center mt-10 mb-10">
                {{ t('userList.noOnlinePlayers') }}
            </li>
        </ul>
        <Pagination />
    </UCard>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useUserStore } from '~/store/user';
import { usePaginationStore } from '~/store/pagination';
import SortingPlayers from './SortingPlayers.vue';
import UserCard from '../user/ui/UserCard.vue';
import Pagination from './Pagination.vue';
import FriendsList from '../friends/ui/FriendsList.vue';
import FriendRequest from '../friends/ui/FriendRequest.vue';

const { t } = useI18n();
const userStore = useUserStore();
const paginationStore = usePaginationStore();

const currentUserId = computed(() => userStore.user?._id);

onMounted(async () => {
    if (userStore.usersList.length === 0) {
        await userStore.getUsersList();
    }
});
</script>

<style scoped>
.user-list {
    max-width: 1400px;
    margin: 0 auto;
}
</style>