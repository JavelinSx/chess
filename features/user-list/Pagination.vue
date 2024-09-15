<template>
    <div class="mt-4 flex justify-center" v-if="paginationStore.totalPages > 1">
        <UPagination v-model="currentPage" :total="paginationStore.totalUsers" :per-page="paginationStore.itemsPerPage"
            :ui="{}">
            <template #prev="{ onClick }">
                <UTooltip :text="t('previousPage')">
                    <UButton icon="i-heroicons-arrow-small-left-20-solid" color="primary" @click="onClick"
                        class="mr-2" />
                </UTooltip>
            </template>
            <template #next="{ onClick }">
                <UTooltip :text="t('nextPage')">
                    <UButton icon="i-heroicons-arrow-small-right-20-solid" color="primary" @click="onClick"
                        class="ml-2" />
                </UTooltip>
            </template>
        </UPagination>
    </div>
    <div class="mt-2 text-sm ">
        {{ t('paginationInfo', {
            currentPage: paginationStore.currentPage,
            totalPages: paginationStore.totalPages,
            shownItems: paginationStore.paginatedUsers.length,
            totalItems: paginationStore.totalUsers
        }) }}
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePaginationStore } from '~/store/pagination';
const { t } = useI18n();
const paginationStore = usePaginationStore();

const currentPage = computed({
    get: () => paginationStore.currentPage,
    set: (value) => paginationStore.setCurrentPage(value),
});
</script>