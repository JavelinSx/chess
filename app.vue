<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">

import { useSSE } from '~/composables/useSSE';
useSSE()

</script>

<style>
/* Здесь могут быть глобальные стили */
</style>