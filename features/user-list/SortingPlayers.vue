<template>
    <div class="flex flex-wrap items-center gap-4">
        <UInput v-model="searchQuery" :placeholder="t('userList.searchByUsername')" icon="i-heroicons-magnifying-glass"
            class="w-full sm:w-auto " />
        <USelect v-model="sortCriteria" :options="localizedSortOptions" :placeholder="t('userList.sortBy')"
            class="w-full sm:w-auto " />
        <UButton @click="toggleSortDirection" icon="i-heroicons-arrows-up-down"
            :aria-label="t('userList.toggleSortDirection')" />
        <UCheckbox v-model="onlineOnly" :label="t('userList.onlineOnly')" />
        <USelect v-model="itemsPerPage" :options="localizedItemsPerPageOptions" :label="t('userList.itemsPerPage')"
            class="w-full sm:w-auto " />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePaginationStore } from '~/store/pagination';
const { t } = useI18n();
const paginationStore = usePaginationStore();

const sortOptions = [
    { label: 'profile.rating', value: 'rating' },
    { label: 'profile.gamesPlayed', value: 'gamesPlayed' },
    { label: 'userList.freePlayers', value: 'isGame' },
];
const localizedSortOptions = computed(() =>
    sortOptions.map(option => ({ ...option, label: t(option.label) }))
);
const localizedItemsPerPageOptions = computed(() =>
    itemsPerPageOptions.map(option => ({ ...option, label: t('pagination.itemsPerPageOption', { count: option.label }) }))
);
const itemsPerPageOptions = [
    { label: '10', value: 9 },
    { label: '20', value: 18 },
    { label: '30', value: 27 },
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