<template>
    <div class="w-full flex flex-col gap-4 items-center justify-center" v-if="user">
        <UserProfile :user="user" />
    </div>
    <div v-else-if="error">
        <p>{{ error }}</p>
    </div>
    <USkeleton v-else class="h-full w-full" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '~/stores/user';
import UserProfile from '~/features/profile/ui/UserProfile.vue';
import type { ClientUser } from '~/server/types/user';

const { t } = useI18n();
const route = useRoute();
const userStore = useUserStore();
const userId = route.params.id as string;
const user = ref<ClientUser | null>(null);
const error = ref<string | null>(null);

const fetchUser = async () => {
    try {
        user.value = await userStore.getUserById(userId);
    } catch (e) {
        error.value = e instanceof Error ? e.message : String(e);
    }
};

onMounted(fetchUser);
watch(() => route.params.id, fetchUser);


</script>