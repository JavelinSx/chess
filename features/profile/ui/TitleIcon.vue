<template>
    <div class="perspective-[1000px]">
        <img :src="titleIcon" :alt="title" class="w-12">
    </div>

</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getTitleForRating } from '../utils/titles';
import beginnerIcon from '~/app/styles/title-icon/beginner-icon.svg?url';
import amateurIcon from '~/app/styles/title-icon/amateur-icon.svg?url';
import advancedIcon from '~/app/styles/title-icon/advanced-icon.svg?url';
import expertIcon from '~/app/styles/title-icon/expert-icon.svg?url';
import masterIcon from '~/app/styles/title-icon/master-icon.svg?url';
import grandMasterIcon from '~/app/styles/title-icon/grandmaster-icon.svg?url';

const props = defineProps<{
    rating: number;
}>();

const { t } = useI18n();

const title = computed(() => getTitleForRating(props.rating));

const titleIcon = computed(() => {
    switch (title.value) {
        case t('title.beginner'):
            return beginnerIcon;
        case t('title.amateur'):
            return amateurIcon;
        case t('title.advanced'):
            return advancedIcon;
        case t('title.expert'):
            return expertIcon;
        case t('title.master'):
            return masterIcon;
        case t('title.grandMaster'):
            return grandMasterIcon;
        default:
            return beginnerIcon;
    }
});
</script>
<style lang="scss"></style>