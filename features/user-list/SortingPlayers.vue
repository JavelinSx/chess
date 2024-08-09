<template>
    <div class="flex items-center space-x-4">
        <USelect v-model="sortCriteria" :options="sortOptions" size="sm" @change="updateFilters" />
        <UButton @click="toggleSortDirection" size="sm">
            <UIcon :name="sortDirection === 'asc' ? 'i-heroicons-arrow-up' : 'i-heroicons-arrow-down'" />
        </UButton>
        <UCheckbox v-model="onlineOnly" name="onlineOnly" label="Online only" @change="updateFilters" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '~/store/user';

const userStore = useUserStore();

const sortOptions = [
    { label: 'Rating', value: 'rating' },
    { label: 'Free', value: 'isGame' },
    { label: 'Games Played', value: 'gamesPlayed' }
];

const sortCriteria = computed({
    get: () => userStore.filterOptions.sortCriteria,
    set: (value) => userStore.updateFilterOptions({ sortCriteria: value })
});

const sortDirection = computed({
    get: () => userStore.filterOptions.sortDirection,
    set: (value) => userStore.updateFilterOptions({ sortDirection: value })
});

const onlineOnly = computed({
    get: () => userStore.filterOptions.onlineOnly,
    set: (value) => userStore.updateFilterOptions({ onlineOnly: value })
});

const toggleSortDirection = () => {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
};

const updateFilters = () => {
    // Этот метод теперь пустой, так как обновление происходит автоматически
    // через computed свойства
};

</script>