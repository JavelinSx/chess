<template>
    <div class="min-h-screen flex flex-col relative">
        <UContainer>
            <nav class="py-4 flex items-center justify-between w-full">
                <NuxtLink to="/" class="text-base font-bold mr-4 text-center sm:text-lg">ChessNexus</NuxtLink>

                <!-- Desktop menu -->
                <div class="hidden md:flex items-center space-x-4">
                    <UButton v-for="link in navLinks" :key="link.to" :to="link.to" color="gray" variant="ghost">
                        {{ link.label }}
                    </UButton>
                    <UButton v-if="isAuthenticated" @click="logout" color="gray" variant="ghost">
                        {{ t('logout') }}
                    </UButton>
                    <LocalesSwitcher />
                    <ToggleTheme />
                </div>

                <!-- Mobile burger menu -->
                <UButton @click="isMenuOpen = !isMenuOpen" size="lg" color="gray" variant="solid" class="md:hidden"
                    aria-label="Menu">
                    <UIcon v-if="!isMenuOpen" name="i-heroicons-bars-3" />
                    <UIcon v-else name="i-heroicons-x-mark" />
                </UButton>
            </nav>
        </UContainer>

        <!-- Mobile menu -->
        <UContainer v-if="isMenuOpen" class="md:hidden">
            <div class="flex flex-col space-y-2 py-4 items-center">
                <UButton v-for="link in navLinks" :key="link.to" :to="link.to" color="gray" variant="ghost" block
                    @click="isMenuOpen = false">
                    {{ link.label }}
                </UButton>
                <UButton v-if="isAuthenticated" @click="logout" color="gray" variant="ghost" block>
                    {{ t('logout') }}
                </UButton>

                <LocalesSwitcher />
                <ToggleTheme />
            </div>
        </UContainer>

        <UButton v-if="isAuthenticated && activeGameId" :to="`/game/${activeGameId}`" color="primary" variant="soft"
            class="w-80 text-center self-center mt-4">
            {{ t('returnToGame') }}
        </UButton>

        <main class="flex-grow w-100">
            <UContainer class="py-4 max-w-[570px] md:max-w-[770px]">
                <slot />
            </UContainer>
            <FloatingChat />
        </main>

        <footer class="py-4 mt-auto">
            <UContainer class="text-center">
                <p>{{ t('copyright', { year: new Date().getFullYear() }) }}</p>
            </UContainer>
        </footer>
        <UButton v-if="isAuthenticated && !chatStore.isOpen" @click="toggleChat" color="primary" variant="soft"
            size="xl" icon="i-heroicons-chat-bubble-left-ellipsis" class="fixed right-4 bottom-4">
            {{ t('chat') }}
            <UBadge v-if="chatStore.unreadMessagesCount > 0" :label="chatStore.unreadMessagesCount" color="red"
                class="absolute -top-2 -right-2" size="sm" />
        </UButton>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../store/auth';
import { useUserStore } from '~/store/user';
import { useGameStore } from '~/store/game';
import { useChatStore } from '~/store/chat';
import { computed, ref } from 'vue';
import FloatingChat from '~/features/chat/ui/FloatingChat.vue';
import ToggleTheme from '~/features/toggleTheme/ui/ToggleTheme.vue'
import LocalesSwitcher from '~/features/locales/ui/LocalesSwitcher.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const userStore = useUserStore();
const gameStore = useGameStore();
const chatStore = useChatStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const chatIsOpen = computed(() => chatStore.isOpen)
const isMenuOpen = ref(false);

const activeGameId = computed(() => {
    const currentGame = gameStore.currentGame;
    return currentGame && currentGame.status === 'active' ? currentGame.id : null;
});

const navLinks = computed(() => [
    { label: t('home'), to: '/' },
    ...(isAuthenticated.value
        ? [{ label: t('profile'), to: `/profile/${userStore.user?._id}` }]
        : [
            { label: t('login'), to: '/login' },
            { label: t('register'), to: '/register' },
        ]),
]);

const logout = async () => {
    await userStore.updateUserStatus(false, false);
    await authStore.logout();
    isMenuOpen.value = false;
};

const toggleChat = () => {
    chatStore.toggleChat();
};
</script>