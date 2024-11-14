// composables/useGoogleAuth.ts
export function useGoogleAuth() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function initiateGoogleAuth() {
    try {
      isLoading.value = true;
      const response = await $fetch<{ authUrl: string }>('/api/auth/google/init', {
        method: 'POST',
      });

      if (response.authUrl) {
        window.location.href = response.authUrl;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start Google auth';
    } finally {
      isLoading.value = false;
    }
  }

  async function handleCallback(code: string) {
    try {
      isLoading.value = true;
      const response = await $fetch('/api/auth/google/callback', {
        method: 'GET',
        params: { code },
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    initiateGoogleAuth,
    handleCallback,
    isLoading,
    error,
  };
}
