<template>
    <UButton :disabled="!isEnabled" color="purple" icon="i-heroicons-play" @click="handleInvite">
        {{ t('game.invite') }}
    </UButton>
</template>

<script setup lang="ts">
import { useInvitationStore } from '~/store/invitation';
import { useUserStore } from '~/store/user';
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
        console.log('User not found:', props.userId);
        return false;
    }
    console.log('User status:', {
        username: user.username,
        isOnline: user.isOnline,
        isGame: user.isGame
    });
    return props.disabled && !user.isGame;
});

const handleInvite = async () => {
    try {
        console.log('Invite button clicked');
        const user = userStore.getUserInUserList(props.userId);
        if (!user || !isEnabled.value) {
            console.log('Invite blocked:', { user, isEnabled: isEnabled.value });
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