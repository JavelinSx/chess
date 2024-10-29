<template>
    <UAccordion :items="accordionItems" :ui="accordionUI" class="mb-4">
        <template #default="{ open, toggle }">
            <UButton class="w-full flex justify-between items-center" color="gray" variant="ghost" @click="toggle">
                <span>{{ t('friends.friends') }} ({{ onlineFriendsCount }} {{ t('common.online') }})</span>
                <UIcon :name="open ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" />
            </UButton>
        </template>
        <template #item="{ item }">
            <div v-if="friends.length > 0"
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 font-semibold">
                <div v-for="friend in friendsInUserList" :key="friend._id">
                    <UserCard v-for="friend in friendsInUserList" :key="friend._id" :user="friend"
                        :current-user-id="userStore.user?._id" :is-in-friend-list="true" />
                </div>
            </div>
            <p v-else class="text-center">{{ t('friends.noFriends') }}</p>
        </template>
    </UAccordion>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useFriendsStore } from '~/store/friends';
import { useUserStore } from '~/store/user';
import { storeToRefs } from 'pinia';
import UserCard from '~/features/user/ui/UserCard.vue';

const { t } = useI18n()
const friendsStore = useFriendsStore();
const userStore = useUserStore();
const { friends } = storeToRefs(friendsStore);
const { usersList } = storeToRefs(userStore);

const friendsInUserList = computed(() =>
    usersList.value.filter(user => friends.value.some(friend => friend._id === user._id))
);

const onlineFriendsCount = computed(() =>
    Array.isArray(friends.value) ? friends.value.filter(friend => friend.isOnline).length : 0
);

const accordionItems = computed(() => [
    {
        label: `Friends ({onlineFriendsCount.value} online)`,
        content: 'Friends list content',
        defaultOpen: false
    }
]);

const accordionUI = {
    wrapper: 'space-y-4',
    item: {
        wrapper: 'overflow-hidden',
        content: 'mt-4',
    },
};

onMounted(async () => {
    await friendsStore.fetchFriends();
});
</script>