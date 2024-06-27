<template>
    <div>
        <h1>Главная страница</h1>
        <NuxtLink to="/chess">Перейти к игре</NuxtLink>
    </div>
</template>

<script setup lang="ts">

definePageMeta({
    middleware: ["auth"]
})
</script>

<style scoped>
h1 {
    color: #333;
}
</style>