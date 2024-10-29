<template>
    <UButton
      color="gray"
      variant="ghost"
      class="w-full mt-4"
      :loading="isLoading"
      @click="handleClick"
    >
      {{ t('auth.loginWithGithub') }}
      <template #leading>
        <UIcon name="i-simple-icons-github" />
      </template>
    </UButton>
  </template>
  
  <script setup lang="ts">
  const { t } = useI18n();
  const { initiateGithubAuth, isLoading, error } = useGithubAuth();
  
  async function handleClick() {
    await initiateGithubAuth();
  }
  </script>