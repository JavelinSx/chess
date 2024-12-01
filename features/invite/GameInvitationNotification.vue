// features/invite/GameInvitationNotification.vue
<template>
    <UNotifications class="flex-s" :ui="{

        title: 'text-lg font-semibold',
        description: 'mt-2 text-base',
    }">
        <template #action-button="{ action }">
            <UButton v-bind="action" class="w-full" />
        </template>
    </UNotifications>
</template>

<script setup lang="ts">

</script>