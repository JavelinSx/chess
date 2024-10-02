<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';
import { useSSEManagement } from './composables/useSSeManagement';
const authStore = useAuthStore();
const userStore = useUserStore();

useSSEManagement();

// Fetch user data if authenticated
onMounted(async () => {
    if (authStore.isAuthenticated && userStore.user) {
        await userStore.getUser(userStore.user._id);
    }
});
</script>