<template>

    <UButton @click="showDurationSelector" class="flex-grow" color="purple" icon="i-heroicons-envelope"
        :disabled="!props.disabled">
        {{ t('game.invite') }}
    </UButton>
    <GameDurationSelector v-if="invitationStore.showDurationSelector" />

</template>

<script setup lang="ts">
import { useInvitationStore } from '~/store/invitation';
import GameDurationSelector from '../game/ui/GameDurationSelector.vue';

const { t } = useI18n();
const invitationStore = useInvitationStore();

const props = defineProps<{
    userId: string
    disabled: boolean;
}>();

function showDurationSelector() {
    invitationStore.showDurationSelectorFor(props.userId);
}
</script>