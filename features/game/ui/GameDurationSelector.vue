<template>
    <UModal v-model="invitationStore.showDurationSelector">
        <UCard>
            <template #header>
                <h3 class="text-xl font-semibold">{{ t('game.selectGameDuration') }}</h3>
            </template>
            <URadioGroup v-model="selectedDuration" :options="durationOptions" />
            <template #footer>
                <div class="flex justify-end space-x-2">
                    <UButton color="gray" @click="cancel">{{ t('common.cancel') }}</UButton>
                    <UButton color="primary" @click="confirm">{{ t('common.confirm') }}</UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useInvitationStore } from '~/store/invitation';

const { t } = useI18n();
const invitationStore = useInvitationStore();

type GameDuration = 15 | 30 | 45 | 90;

const durationOptions = [
    { label: t('game.15minutes'), value: 15 },
    { label: t('game.30minutes'), value: 30 },
    { label: t('game.45minutes'), value: 45 },
    { label: t('game.90minutes'), value: 90 },
] as { label: string; value: GameDuration }[];

const selectedDuration = ref<GameDuration>(30);

function confirm() {
    invitationStore.sendGameInvitation(selectedDuration.value);
}

function cancel() {
    invitationStore.closeDurationSelector();
}
</script>