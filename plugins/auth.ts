import { useAuthStore } from '~/stores/auth';
import { useUserStore } from '~/stores/user';

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  const userStore = useUserStore();

  try {
    const response = await $fetch<{ isAuthenticated: boolean; user?: any }>('/api/auth/check');

    if (response.isAuthenticated && response.user) {
      authStore.setIsAuthenticated(true);
      userStore.setUser(response.user);
    } else {
      authStore.setIsAuthenticated(false);
      userStore.clearUser();
    }
  } catch (error) {
    authStore.setIsAuthenticated(false);
    userStore.clearUser();
  }
});
