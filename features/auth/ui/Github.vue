<!-- features/auth/ui/Github.vue -->
<template>
  <button @click="handleClick" type="button" :disabled="isLoading" class="github-btn w-full h-10 relative my-4 border text-sm rounded-md font-medium 
           bg-[#24292e] dark:bg-[#333] 
           hover:bg-[#2c3238] dark:hover:bg-[#404040]
           focus:outline-none focus:ring-2 
           focus:ring-offset-2 focus:ring-gray-500 
           disabled:opacity-50 disabled:cursor-not-allowed
           border-gray-700 dark:border-gray-600
           flex items-center justify-center gap-2 px-3
           transition-all duration-200 ease-in-out">
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center 
                bg-[#24292e] dark:bg-[#333] bg-opacity-50 dark:bg-opacity-50 rounded-md">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-5 w-5 text-white" />
    </div>

    <UIcon name="i-simple-icons-github" class="w-5 h-5 text-white" />
    <span class="text-white whitespace-nowrap">
      {{ t('auth.continueWithGithub') }}
    </span>
  </button>
</template>

<script setup lang="ts">
const { t } = useI18n();
const { initiateGithubAuth, isLoading, error } = useGithubAuth();

async function handleClick() {
  await initiateGithubAuth();
}
</script>

<style scoped>
.github-btn {
  box-shadow: 0 1px 3px 0 rgba(27, 31, 35, 0.3), 0 1px 2px 0 rgba(27, 31, 35, 0.15);
  transition: all 0.2s ease-in-out;
}

.github-btn:hover {
  box-shadow: 0 2px 6px 0 rgba(27, 31, 35, 0.3), 0 1px 2px 0 rgba(27, 31, 35, 0.15);
}

.github-btn:active {
  transform: translateY(1px);
}

:root.dark .github-btn {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.25);
}

:root.dark .github-btn:hover {
  box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.25);
}
</style>