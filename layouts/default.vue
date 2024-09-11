<template>
    <div class="min-h-screen flex flex-col">
        <UContainer>
            <nav class="py-4 flex items-center justify-between">
                <NuxtLink to="/" class="text-base font-bold mr-4 text-center sm:text-lg">Chess App</NuxtLink>
                <div class="flex items-center space-x-4">
                    <UButton v-for="link in navLinks" :key="link.to" :to="link.to" color="gray" variant="ghost">
                        {{ link.label }}
                    </UButton>
                    <UButton v-if="isAuthenticated" @click="logout" color="gray" variant="ghost">
                        Logout
                    </UButton>
                </div>
                <ToggleTheme class="ml-4" />
            </nav>
        </UContainer>
        <UButton v-if="isAuthenticated && activeGameId" :to="`/game/${activeGameId}`" color="primary" variant="soft"
            class="w-80 text-center self-center">
            Return to Game
        </UButton>
        <main class="flex-grow w-100">
            <UContainer class="py-8 max-w-[570px] md:max-w-[770px]">
                <slot />
            </UContainer>
            <FloatingChat />
        </main>
        <footer class="py-4 mt-auto">
            <UContainer class="text-center">
                <p>&copy; {{ new Date().getFullYear() }} Chess App. All rights reserved.</p>
            </UContainer>
        </footer>
        <Chat v-if="isChatOpen" :otherUserId="currentChatUserId!" />
        <UNotifications />
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';
import { useGameStore } from '~/store/game';
import { useChatStore } from '~/store/chat';
import { computed } from 'vue';
import FloatingChat from '~/features/chat/ui/FloatingChat.vue';
import ToggleTheme from '~/features/toggleTheme/ui/ToggleTheme.vue'

const authStore = useAuthStore();
const userStore = useUserStore();
const gameStore = useGameStore();
const chatStore = useChatStore();

const { isChatOpen, currentChatUserId } = storeToRefs(chatStore);

const isAuthenticated = computed(() => authStore.isAuthenticated);

const activeGameId = computed(() => {
    const currentGame = gameStore.currentGame;
    return currentGame && currentGame.status === 'active' ? currentGame.id : null;
});

const navLinks = computed(() => [
    { label: 'Home', to: '/' },
    ...(isAuthenticated.value
        ? [{ label: 'Profile', to: `/profile/${userStore.user?._id}` }]
        : [
            { label: 'Login', to: '/login' },
            { label: 'Register', to: '/register' },
        ]),
]);

const logout = async () => {
    await userStore.updateUserStatus(false, false);
    await authStore.logout();
};

// Добавим watcher для отслеживания изменений isChatOpen
watch(isChatOpen, (newValue) => {
    console.log('isChatOpen changed:', newValue);
});
watch(currentChatUserId, (newValue) => {
    console.log('currentChatUserId changed:', newValue);
});
</script>