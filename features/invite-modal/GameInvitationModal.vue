<template>
    <UModal v-model="isOpen">
        <UCard>
            <template #header>
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-bold">{{ t('gameInvitation') }}</h3>
                    <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="closeModal" />
                </div>
            </template>
            <p class="mb-4 ">
                <span class="font-semibold ">{{ invitationStore.currentInvitation?.fromInviteName }}</span>
                {{ t('invitesYouToPlay') }}
            </p>
            <template #footer>
                <div class="flex justify-end space-x-2">
                    <UButton color="gray" @click="rejectInvitation">{{ t('decline') }}</UButton>
                    <UButton color="primary" @click="acceptInvitation">{{ t('accept') }}</UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
import { useInvitationStore } from '~/store/invitation';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
const { t } = useI18n()
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