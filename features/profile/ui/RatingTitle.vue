<template>
    <UCard>
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl sm:text-lg font-semibold">{{ t('profile.rating') }}</h3>
            <span class="text-2xl sm:text-lg font-bold">{{ rating }}</span>
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
import { titles } from '../utils/titles';
const props = defineProps<{
    rating: number;
}>();

const { t } = useI18n();

const maxToCurrentRang = computed(() => {
    for (const item of titles) {
        if (item.minRating <= props.rating && props.rating <= item.maxRating) return item.maxRating
        else if (props.rating > titles[titles.length - 1].maxRating) return 3000
    }
})

const title = computed(() => getTitleForRating(props.rating));
const ratingPercentage = computed(() => (props.rating / maxToCurrentRang.value!) * 100);

</script>