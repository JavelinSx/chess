<template>
    <UButton :disabled="!isEnabled" color="purple" icon="i-heroicons-play" @click="handleInvite">
        {{ t('game.invite') }}
    </UButton>
</template>

<script setup lang="ts">
import { useInvitationStore } from '~/stores/invitation';
import { useUserStore } from '~/stores/user';
import { storeToRefs } from 'pinia';

const props = defineProps<{
    userId: string;
    disabled: boolean;
}>();

const { t } = useI18n();
const invitationStore = useInvitationStore();
const userStore = useUserStore();

const isEnabled = computed(() => {
    const user = userStore.getUserInUserList(props.userId);
    if (!user) {
        return false;
    }
    return props.disabled && !user.isGame;
});

const handleInvite = async () => {
    try {
        const user = userStore.getUserInUserList(props.userId);
        if (!user || !isEnabled.value) {
            return;
        }
        await invitationStore.showDurationSelectorFor({
            _id: user._id,
            username: user.username
        });
    } catch (error) {
        console.error('Error in handleInvite:', error);
    }
};
</script>