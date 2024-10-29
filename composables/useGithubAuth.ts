import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';
import type { ApiResponse } from '~/server/types/api';
import type { ClientUser } from '~/server/types/user';
import type { AuthData } from '~/server/types/auth';

export function useGithubAuth() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const router = useRouter();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function initiateGithubAuth() {
    isLoading.value = true;
    error.value = null;

    try {
      const state = Math.random().toString(36).substring(7);
      localStorage.setItem('github_state', state);

      const params = new URLSearchParams({
        client_id: config.public.githubClientId,
        redirect_uri: config.public.githubRedirectUri,
        scope: 'user:email',
        state: state,
        allow_signup: 'false',
      });

      params.append('login', '');

      window.location.href = `https://github.com/login/oauth/authorize?${params}`;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start GitHub auth';
      isLoading.value = false;
    }
  }

  async function handleCallback(code: string, state: string) {
    if (state !== localStorage.getItem('github_state')) {
      throw new Error('Invalid state parameter');
    }

    try {
      const response = await $fetch('/api/auth/github', {
        method: 'POST',
        body: { code },
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.user) {
        const user: ClientUser = {
          ...response.data.user,
          lastLogin: new Date(response.data.user.lastLogin),
        };
        console.log(user);
        authStore.setIsAuthenticated(true);
        userStore.setUser(user);
        await router.push('/');
      }
    } finally {
      localStorage.removeItem('github_state');
    }
  }

  return {
    initiateGithubAuth,
    handleCallback,
    isLoading,
    error,
  };
}
