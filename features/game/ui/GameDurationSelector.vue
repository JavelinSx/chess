<!-- features/game/ui/GameDurationSelector.vue -->
<template>
    <UModal v-model="showModal" :ui="{
        width: 'w-72 md:w-full'
    }">
        <UCard>
            <template #header>
                <h3 class="text-xl font-semibold">
                    {{ t('game.selectGameDuration') }}
                </h3>
            </template>

            <UCard class="mb-4">
                <template #header>
                    <h3 class="text-base md:text-xl font-semibold">
                        {{ t('common.colorSelect') }}
                    </h3>
                </template>
                <URadioGroup v-model="selectedColor" name="color" :options="colorOptions" />
            </UCard>

            <UCard>
                <template #header>
                    <h3 class="text-base md:text-xl font-semibold">
                        {{ t('common.timeSelect') }}
                    </h3>
                </template>
                <URadioGroup v-model="selectedDuration" name="duration" :options="durationOptions" />
            </UCard>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton @click="invitationStore.closeDurationSelector" color="red">
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
import type { GameDuration, StartColor } from '~/server/types/game';

const { t } = useI18n();
const invitationStore = useInvitationStore();

const selectedDuration = ref<GameDuration>(30);
const selectedColor = ref<StartColor>('random')

// Опции для выбора длительности игры
const durationOptions = computed(() => [
    { label: t('game.15minutes'), value: 15 },
    { label: t('game.30minutes'), value: 30 },
    { label: t('game.45minutes'), value: 45 },
    { label: t('game.90minutes'), value: 90 },
] as { label: string; value: GameDuration }[]);

const colorOptions = computed(() => [
    {
        label: t('game.white'), value: 'white'
    },
    {
        label: t('game.black'), value: 'black'
    },
    {
        label: t('game.random'), value: 'random'
    },
] as { label: string; value: StartColor }[])

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
        await invitationStore.sendGameInvitation(inviteeData.value, selectedDuration.value, selectedColor.value);
    }
};
</script>