<template>
    <div>
        <NuxtLayout>
        </NuxtLayout>
    </div>
    <UModals />
</template>

<script setup lang="ts">
import { useSSEManagement } from './composables/sse/useSSEManagement';

const { isAuthenticated } = useAuth();

onBeforeMount(() => {
    useSSEManagement();
    if (isAuthenticated.value) {
        useHeartbeat()
    }
})

</script>
<style>
.page-enter-active,
.page-leave-active {
    transition: all 0.4s;
}

.page-enter-from,
.page-leave-to {
    opacity: 0;
    filter: blur(1rem);
}
</style>