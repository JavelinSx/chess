<!-- UserCard.vue -->
<template>
    <div class="p-4 border rounded-lg">
        <div class="flex flex-col  items-start sm:items-center justify-between w-full">
            <!-- User Info Section -->
            <div class="flex items-center mb-2">
                <UAvatar :src="getUserAvatar(user)" :alt="user.username" class="mr-4" />
                <div>
                    <p class="font-semibold">{{ user.username }}</p>
                    <p class="text-sm text-gray-500">Rating: {{ user.rating }}</p>
                    <p class="text-sm text-gray-500">Games played: {{ user.gamesPlayed }}</p>
                    <p class="text-sm text-gray-500">Win rate: {{ calculateWinRate(user) }}%</p>
                </div>
            </div>

            <!-- User Actions Section -->
            <div class="flex flex-row items-start mt-2 gap-3">
                <UBadge :color="user.isOnline ? 'green' : 'gray'" class="w-20 flex justify-center h-8">
                    {{ user.isOnline ? 'Online' : 'Offline' }}
                </UBadge>
                <UBadge v-if="user.isGame" color="blue" class="w-20 flex justify-center h-8">In Game</UBadge>
                <UButton v-if="canInvite" @click="inviteToGame" color="violet" variant="solid" size="sm"
                    class="w-20 flex justify-center">
                    Invite
                </UButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useInvitationStore } from '~/store/invitation';

const invitationStore = useInvitationStore();

const props = defineProps<{
    user: any;
    currentUserId: string | undefined;
}>();

const canInvite = computed(() => {
    return props.user.isOnline && !props.user.isGame && props.user._id !== props.currentUserId;
});

function inviteToGame() {
    invitationStore.sendGameInvitation(props.user._id);
}

const emit = defineEmits<{
    (e: 'invite', id: string): void;
}>();

function getUserAvatar(user: any) {
    return ''
}

function calculateWinRate(user: any) {
    if (user.gamesPlayed === 0) return 0;
    return ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1);
}

</script>