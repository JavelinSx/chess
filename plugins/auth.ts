import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  const userStore = useUserStore();

  console.log('Auth plugin initialized');

  try {
    const response = await $fetch<{ isAuthenticated: boolean; user?: any }>('/api/auth/check');
    console.log('Auth check response:', response);

    if (response.isAuthenticated && response.user) {
      console.log('User is authenticated');
      authStore.setIsAuthenticated(true);
      userStore.setUser(response.user);
    } else {
      console.log('User is not authenticated');
      authStore.setIsAuthenticated(false);
      userStore.clearUser();
    }
  } catch (error) {
    console.error('Authentication check error:', error);
    authStore.setIsAuthenticated(false);
    userStore.clearUser();
  }
});
