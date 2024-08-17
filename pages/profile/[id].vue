<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8 text-center">User Profile</h1>
    <ProfileEdit v-if="user" :user="user" />
    <p v-else-if="error">Error: {{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import ProfileEdit from '~/features/profile-edit/ui/ProfileEdit.vue';
import { useUserStore } from '~/store/user';
import { useRoute } from 'vue-router';

const userStore = useUserStore();
const route = useRoute();
const userId = route.params.id as string;

const { data: user, error } = await useAsyncData(
  'userProfile',
  async () => {
    if (userId) {
      const userData = await userStore.getUser(userId);

      return userData;
    }
    return null;
  },

);
</script>