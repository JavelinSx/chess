<template>
    <div v-if="user">
        <UserProfile :user="user" />
    </div>
    <div v-else-if="error">
        <p>{{ error }}</p>
    </div>
    <div v-else>
        <p>{{ t('common.loading') }}</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '~/store/user';
import UserProfile from '~/features/profile/ui/UserProfile.vue';
import type { ClientUser } from '~/server/types/user';

const { t } = useI18n();
const route = useRoute();
const userStore = useUserStore();

const user = ref<ClientUser | null>(null);
const error = ref<string | null>(null);

onMounted(() => {
    const userId = route.params.id as string;
    user.value = userStore.getUserById(userId)!
});
</script>