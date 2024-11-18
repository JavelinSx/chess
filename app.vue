<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
import { useSSEManagement } from '#imports';
const { isAuthenticated } = useAuth();
useSSEManagement();
if (isAuthenticated.value) {
    useHeartbeat()
}
</script>