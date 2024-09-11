<template>
    <div class="mt-4 flex justify-center" v-if="paginationStore.totalPages > 1">
        <UPagination v-model="currentPage" :total="paginationStore.totalUsers" :per-page="paginationStore.itemsPerPage"
            :ui="{}">
            <template #prev="{ onClick }">
                <UTooltip text="Previous page">
                    <UButton icon="i-heroicons-arrow-small-left-20-solid" color="primary" @click="onClick"
                        class="mr-2" />
                </UTooltip>
            </template>
            <template #next="{ onClick }">
                <UTooltip text="Next page">
                    <UButton icon="i-heroicons-arrow-small-right-20-solid" color="primary" @click="onClick"
                        class="ml-2" />
                </UTooltip>
            </template>
        </UPagination>
    </div>
    <div class="mt-2 text-sm ">
        Page {{ paginationStore.currentPage }} of {{ paginationStore.totalPages }}
        ({{ paginationStore.paginatedUsers.length }} items shown, {{ paginationStore.totalUsers }} total)
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePaginationStore } from '~/store/pagination';

const paginationStore = usePaginationStore();

const currentPage = computed({
    get: () => paginationStore.currentPage,
    set: (value) => paginationStore.setCurrentPage(value),
});
</script>