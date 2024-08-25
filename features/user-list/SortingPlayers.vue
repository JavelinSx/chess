<template>
    <div class="flex flex-wrap items-center gap-4">
        <UInput v-model="searchQuery" placeholder="Search by username" icon="i-heroicons-magnifying-glass"
            class="w-full sm:w-auto" />
        <USelect v-model="sortCriteria" :options="sortOptions" placeholder="Sort by" class="w-full sm:w-auto" />
        <UButton @click="toggleSortDirection" icon="i-heroicons-arrows-up-down" />
        <UCheckbox v-model="onlineOnly" label="Online only" />
        <USelect v-model="itemsPerPage" :options="itemsPerPageOptions" label="Items per page"
            class="w-full sm:w-auto" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePaginationStore } from '~/store/pagination';

const paginationStore = usePaginationStore();

const sortOptions = [
    { label: 'Rating', value: 'rating' },
    { label: 'Games Played', value: 'gamesPlayed' },
    { label: 'Free Players', value: 'isGame' },
];

const itemsPerPageOptions = [
    { label: '9', value: 9 },
    { label: '18', value: 18 },
    { label: '27', value: 27 },
];

const searchQuery = computed({
    get: () => paginationStore.searchQuery,
    set: (value) => paginationStore.setSearchQuery(value),
});

const sortCriteria = computed({
    get: () => paginationStore.filterOptions.sortCriteria,
    set: (value) => paginationStore.updateFilterOptions({ sortCriteria: value }),
});

const onlineOnly = computed({
    get: () => paginationStore.filterOptions.onlineOnly,
    set: (value) => paginationStore.updateFilterOptions({ onlineOnly: value }),
});

const itemsPerPage = computed({
    get: () => paginationStore.itemsPerPage,
    set: (value) => paginationStore.setItemsPerPage(value),
});

function toggleSortDirection() {
    const newDirection = paginationStore.filterOptions.sortDirection === 'asc' ? 'desc' : 'asc';
    paginationStore.updateFilterOptions({ sortDirection: newDirection });
}
</script>