<template>
  <div class="container mx-auto px-4 py-8">
    <ProfileEdit v-if="user" :user="userStore.user" />
  </div>
</template>

<script setup lang="ts">
import ProfileEdit from '~/features/profile-edit/ui/ProfileEdit.vue';
import { useUserStore } from '~/store/user';
import { useRoute } from 'vue-router';

const userStore = useUserStore();
const route = useRoute();
const userId = route.params.id as string;
const user = computed(() => userStore.user)
// const { data: user, error } = await useAsyncData(
//   'userProfile',
//   async () => {
//     if (userId) {
//       const userData = await userStore.getUser(userId);

//       return userData;
//     }
//     return null;
//   },

// );
</script>