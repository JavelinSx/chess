<template>
    <UModal v-model="invitationStore.showInvitationModal">
        <UCard>
            <template #header>
                <h3 class="text-xl font-bold">{{ t('game.gameInvitation') }}</h3>
            </template>
            <p v-if="invitationStore.currentInvitation">
                {{ invitationStore.currentInvitation.fromInviteName }} {{ t('invitesYouToPlay') }}
                ({{ invitationStore.currentInvitation.gameDuration }} {{ t('minutes') }})
            </p>
            <template #footer>
                <div class="flex justify-end space-x-2">
                    <UButton color="red" @click="invitationStore.rejectGameInvitation">
                        {{ t('common.decline') }}
                    </UButton>
                    <UButton color="green" @click="invitationStore.acceptGameInvitation">
                        {{ t('common.accept') }}
                    </UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
import { useInvitationStore } from '~/store/invitation';

const { t } = useI18n();
const invitationStore = useInvitationStore();

</script>