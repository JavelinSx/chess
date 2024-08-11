<template>
    <div class="flex flex-wrap items-center gap-4">
        <UInput v-model="searchQuery" placeholder="Search by username" icon="i-heroicons-magnifying-glass"
            class="w-full sm:w-auto" />
        <USelect v-model="sortCriteria" :options="sortOptions" placeholder="Sort by" class="w-full sm:w-auto" />
        <UButton @click="toggleSortDirection" icon="i-heroicons-arrows-up-down" />
        <UCheckbox v-model="onlineOnly" label="Online only" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '~/store/user';

const userStore = useUserStore();

const sortOptions = [
    { label: 'Rating', value: 'rating' },
    { label: 'Games Played', value: 'gamesPlayed' },
    { label: 'Free Players', value: 'isGame' },
];

const searchQuery = computed({
    get: () => userStore.searchQuery,
    set: (value) => userStore.setSearchQuery(value),
});

const sortCriteria = computed({
    get: () => userStore.filterOptions.sortCriteria,
    set: (value) => userStore.updateFilterOptions({ sortCriteria: value }),
});

const onlineOnly = computed({
    get: () => userStore.filterOptions.onlineOnly,
    set: (value) => userStore.updateFilterOptions({ onlineOnly: value }),
});

function toggleSortDirection() {
    const newDirection = userStore.filterOptions.sortDirection === 'asc' ? 'desc' : 'asc';
    userStore.updateFilterOptions({ sortDirection: newDirection });
}
</script>