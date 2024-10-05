<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
import { useSSEManagement } from '#imports';

useSSEManagement();
</script>