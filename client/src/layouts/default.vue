<template>
  <main>
    <TopNavBar></TopNavBar>
    <slot />
  </main>
</template>
<script setup lang="ts">
import TopNavBar from '~/shared/components/TopNavBar.vue'
</script>
