<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>

<script setup lang="ts">
import { useUserSSE } from '~/composables/useUserSSE';

useUserSSE();

</script>

<style>
/* Здесь могут быть глобальные стили */
</style>