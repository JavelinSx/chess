<!-- features/user-list/UserList.vue -->
<template>
    <div>
        <h2>Users</h2>
        <ul>
            <li v-for="user in usersList" :key="user._id">
                {{ user.username }}
                <span v-if="user.isOnline" class="text-green">Online</span>
                <span v-else class="text-gray">Offline</span>
                <span v-if="user.isGame" class="text-blue">In Game</span>
                <button v-if="user.isOnline && !user.isGame && user._id !== currentUserId"
                    @click="inviteToGame(user._id)">
                    Invite to game
                </button>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '~/store/user';

const userStore = useUserStore();
const usersList = computed(() => userStore.usersList);
const currentUserId = computed(() => userStore.user?._id);

function inviteToGame(inviteeId: string) {
    userStore.sendGameInvitation(inviteeId);
}
</script>

<style scoped>
.text-green {
    color: green;
}

.text-gray {
    color: gray;
}

.text-blue {
    color: blue;
}
</style>