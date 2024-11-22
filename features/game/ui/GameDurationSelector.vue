<!-- features/game/ui/GameDurationSelector.vue -->
<template>
    <UModal v-model="showModal">
        <UCard>
            <template #header>
                <h3 class="text-xl font-semibold">
                    {{ t('game.selectGameDuration') }}
                </h3>
            </template>

            <URadioGroup v-model="selectedDuration" name="duration" :options="durationOptions" />

            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton @click="invitationStore.closeDurationSelector">
                        {{ t('common.cancel') }}
                    </UButton>
                    <UButton @click="handleConfirm" color="primary">
                        {{ t('common.confirm') }}
                    </UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useInvitationStore } from '~/store/invitation';
import type { GameDuration } from '~/server/types/game';

const { t } = useI18n();
const invitationStore = useInvitationStore();

const selectedDuration = ref<GameDuration>(30);

// Опции для выбора длительности игры
const durationOptions = computed(() => [
    { label: t('game.15minutes'), value: 15 },
    { label: t('game.30minutes'), value: 30 },
    { label: t('game.45minutes'), value: 45 },
    { label: t('game.90minutes'), value: 90 },
] as { label: string; value: GameDuration }[]);

// Управление видимостью модального окна через store
const showModal = computed({
    get: () => invitationStore.showDurationSelector,
    set: (value: boolean) => {
        if (!value) {
            invitationStore.closeDurationSelector();
        }
    }
});
const inviteeData = computed(() => invitationStore.infoInvitation)
const handleConfirm = async () => {
    if (inviteeData.value) {
        await invitationStore.sendGameInvitation(inviteeData.value, selectedDuration.value);
    }
};
</script>