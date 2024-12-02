<template>
    <UCard>
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl sm:text-lg font-semibold">{{ t('profile.rating') }}</h3>
            <span class="text-2xl sm:text-lg font-bold">{{ displayedRating }}</span>
            <TitleIcon :rating="props.rating" class="w-8 h-8" />
        </div>
        <div class="mb-2">
            <UProgress class="animated-progress" :value="ratingPercentage" color="primary" />
        </div>
        <p class="text-center text-lg font-medium">{{ title }}</p>
    </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getTitleForRating } from '../utils/titles';
import TitleIcon from './TitleIcon.vue';
import { titles } from '../utils/titles';
const props = defineProps<{
    rating: number;
}>();

const { t } = useI18n();
const displayedRating = ref(props.rating);
const animationDuration = 1000;

const maxToCurrentRang = computed(() => {
    for (const item of titles) {
        if (item.minRating <= displayedRating.value && displayedRating.value <= item.maxRating)
            return item.maxRating;
        else if (displayedRating.value > titles[titles.length - 1].maxRating)
            return 3000;
    }
    return 3000;
});

const title = computed(() => getTitleForRating(displayedRating.value));
const ratingPercentage = computed(() => {
    const rating = Math.max(0, displayedRating.value);
    return (rating / maxToCurrentRang.value!) * 100;
});

const animateValue = (start: number, end: number, duration: number) => {
    end = Math.max(0, end);

    const stepCount = 60;
    const stepValue = (end - start) / stepCount;
    const stepDuration = duration / stepCount;
    let current = start;
    let step = 0;

    const animation = setInterval(() => {
        step++;
        current = start + (stepValue * step);
        displayedRating.value = Math.max(0, Math.round(current));

        if (step >= stepCount) {
            clearInterval(animation);
            displayedRating.value = Math.max(0, end);
        }
    }, stepDuration);
};

watch(() => props.rating, (newValue, oldValue) => {
    if (typeof oldValue === 'number') {
        animateValue(oldValue, newValue, animationDuration);
    } else {
        displayedRating.value = newValue;
    }
}, { immediate: true });

</script>
<style lang="scss" scoped>
.animated-progress :deep(progress) {
    &::-webkit-progress-value {
        transition: all 1s ease-in-out !important;
    }

    &::-moz-progress-bar {
        transition: all 1s ease-in-out !important;
    }
}

.text-2xl {
    transition: all 10s ease-in-out;
}
</style>