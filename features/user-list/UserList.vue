<template>
    <UCard class="user-list h-full w-full" :ui="{
        base: 'h-full ',
        body: {
            base: 'h-full w-full ',
            background: '',
            padding: 'px-0 py-5 sm:p-4 md:px-6',
        },
        header: {
            base: '',
            padding: 'px-0 py-5 sm:px-4 md:px-6'
        }
    }">
        <template #header>
            <h2 class="text-xl font-bold mb-4">{{ t('userList.onlinePlayers') }}</h2>
            <SortingPlayers />
        </template>


        <ul class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <li v-if="paginationStore.paginatedUsers.length > 0" v-for="user in paginatedUsers" :key="user._id">
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

const { t } = useI18n();
const userStore = useUserStore();
const paginationStore = usePaginationStore();
const { paginatedUsers } = storeToRefs(paginationStore);
const currentUserId = computed(() => userStore.user?._id);

onMounted(async () => {
    if (userStore.usersList.length === 0) {
        await userStore.getUsersList();
    }
});
</script>

<style scoped></style>