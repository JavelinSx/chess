<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
import { useSSEManagement } from './composables/sse/useSSEManagement';
const { isAuthenticated } = useAuth();
useSSEManagement();
if (isAuthenticated.value) {
    useHeartbeat()
}
</script>