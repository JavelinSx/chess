<template>
    <UCard>
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold">{{ t('profile.rating') }}</h3>
            <span class="text-2xl font-bold">{{ rating }}</span>
            <TitleIcon :rating="props.rating" class="w-8 h-8" />
        </div>
        <div class="mb-2">
            <UProgress :value="ratingPercentage" color="primary" />
        </div>
        <p class="text-center text-lg font-medium">{{ title }}</p>
    </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getTitleForRating } from '../utils/titles';
import TitleIcon from './TitleIcon.vue';
import { useUserStore } from '~/store/user';

const props = defineProps<{
    rating: number;
}>();

const { t } = useI18n();

const userStore = useUserStore()
const title = computed(() => getTitleForRating(props.rating));
const ratingPercentage = computed(() => (props.rating / 2200) * 100);

</script>