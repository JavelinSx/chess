<!-- features/invite/GameInvitationModal.vue -->
<template>
    <UModal v-model="showModal" :ui="{ container: 'flex items-center justify-center min-h-screen sm:items-center' }">
        <UCard>
            <template #header>
                <h3 class="text-xl font-bold">{{ t('game.gameInvitation') }}</h3>
            </template>

            <p v-if="currentInvitation">
                {{ currentInvitation?.fromInviteName }}
                {{ t('game.invitesYouToPlay') }}
                ({{ currentInvitation?.gameDuration }} {{ t('game.minutes') }})
            </p>

            <template #footer>
                <div class="flex flex-col gap-4">
                    <div class="flex justify-end space-x-2">
                        <UButton color="red" @click="invitationStore.rejectGameInvitation">
                            {{ t('common.decline') }}
                        </UButton>
                        <UButton color="green" @click="handleAccept">
                            {{ t('common.accept') }}
                        </UButton>
                    </div>
                    <UProgress :value="progressValue" color="primary" />
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
import { useInvitationStore } from '~/store/invitation';
console.log('hello')
const { t } = useI18n();
const invitationStore = useInvitationStore();
const showModal = computed(() => invitationStore.showInvitationModal);
const progressValue = computed(() => invitationStore.progressValue);
const currentInvitation = computed(() => invitationStore.currentInvitation);
const handleAccept = async () => {
    console.log('before')
    await invitationStore.acceptGameInvitation
    console.log('after')
}
</script>