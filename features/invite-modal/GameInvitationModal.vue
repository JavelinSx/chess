<!-- features/invite-modal/GameInvitationModal.vue -->
<template>
    <div class="game-invitation-modal">
        <h2>Game Invitation</h2>
        <p>{{ userStore.currentInvitation?.fromInviteName }} invites you to play a game!</p>
        <button @click="acceptInvitation">Accept</button>
        <button @click="rejectInvitation">Reject</button>
    </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/store/user';

const userStore = useUserStore();

function acceptInvitation() {
    userStore.acceptGameInvitation();
}

function rejectInvitation() {
    userStore.rejectGameInvitation();
}
</script>

<style scoped>
.game-invitation-modal {
    /* Добавьте стили для модального окна */
}
</style>