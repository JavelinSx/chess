<template>
    <div>
        <UButton v-if="isDark" @click="toggleTheme" icon="i-heroicons-sun" variant="ghost" />
        <UButton v-else @click="toggleTheme" icon="i-heroicons-moon" variant="ghost" />
    </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '~/stores/theme';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);

const toggleTheme = () => {
    themeStore.toggleTheme();
};

onMounted(() => {
    themeStore.initTheme();
});
</script>