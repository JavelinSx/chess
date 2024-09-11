<template>
    <UModal v-model="isOpen">
        <UCard>
            <template #header>
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-bold">Game Invitation</h3>
                    <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="closeModal" />
                </div>
            </template>
            <p class="mb-4 ">
                <span class="font-semibold ">{{ invitationStore.currentInvitation?.fromInviteName
                    }}</span> invites
                you
                to play a game!
            </p>
            <template #footer>
                <div class="flex justify-end space-x-2">
                    <UButton color="gray" @click="rejectInvitation">
                        Decline</UButton>
                    <UButton color="primary" @click="acceptInvitation">Accept</UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
import { useInvitationStore } from '~/store/invitation';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const invitationStore = useInvitationStore();
const { currentInvitation } = storeToRefs(invitationStore);

const isOpen = computed({
    get: () => !!currentInvitation.value,
    set: () => { },
});

function acceptInvitation() {
    invitationStore.acceptGameInvitation();
}

function rejectInvitation() {
    invitationStore.rejectGameInvitation();
}

function closeModal() {
    invitationStore.rejectGameInvitation();
}
</script>