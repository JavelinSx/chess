<template>
  <div class="mx-auto px-4 py-8">
    <ProfileEdit v-if="user" :user="userStore.user!" />
  </div>
</template>

<script setup lang="ts">
import ProfileEdit from '~/features/profile/ui/ProfileEdit.vue';
import { useUserStore } from '~/stores/user';
import { useRoute } from 'vue-router';

const userStore = useUserStore();
const route = useRoute();
const userId = route.params.id as string;
const user = ref(userStore.user)

</script>