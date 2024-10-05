<template>
    <UModal v-model="invitationStore.showInvitationModal">
        <UCard>
            <template #header>
                <h3 class="text-xl font-bold">{{ t('game.gameInvitation') }}</h3>
            </template>
            <p v-if="invitationStore.currentInvitation">
                {{ invitationStore.currentInvitation.fromInviteName }} {{ t('game.invitesYouToPlay') }}
                ({{ invitationStore.currentInvitation.gameDuration }} {{ t('game.minutes') }})
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
import { ref, onMounted, onUnmounted, watch } from 'vue';

const { t } = useI18n();
const invitationStore = useInvitationStore();
const remainingSeconds = ref(15);

let intervalId: NodeJS.Timeout | null = null;

const startCountdown = () => {
    remainingSeconds.value = 15;
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
        remainingSeconds.value--;
        if (remainingSeconds.value <= 0) {
            clearInterval(intervalId!);
            invitationStore.expireInvitation();
        }
    }, 1000);
};

watch(() => invitationStore.showInvitationModal, (newValue) => {
    if (newValue) {
        startCountdown();
    } else if (intervalId) {
        clearInterval(intervalId);
    }
});

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
});
</script>