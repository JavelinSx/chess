<template>
    <div class="min-h-screen flex flex-col md:items-center relative ">
        <UContainer :ui="{ base: 'm-0 ' }" class="fixed z-50 bg-white dark:bg-[#121212] w-full flex justify-center">
            <nav class="py-4 flex items-center justify-between max-w-[570px] sm:w-full">
                <NuxtLink to="/" class="text-2xl font-bold mr-4 text-center sm:text-xl text-green-600">ChessNexus
                </NuxtLink>

                <!-- Desktop menu -->
                <div class="hidden md:flex items-center space-x-4">
                    <UButton v-for="link in navLinks" :key="link.to" :to="link.to" color="gray" variant="ghost">
                        {{ link.label }}
                    </UButton>
                    <UButton v-if="isAuthenticated" @click="logout" color="gray" variant="ghost">
                        {{ t('auth.logout') }}
                    </UButton>
                    <LocalesSwitcher />
                    <ToggleTheme />
                </div>

                <!-- Mobile burger menu -->
                <UButton @click="isMenuOpen = !isMenuOpen"
                    :class="isMenuOpen ? 'fixed right-6 top-4' : 'inharit right-0'" size="lg" color="gray"
                    variant="solid" class="md:hidden z-50" aria-label="Menu">
                    <UIcon class="text-green-400" v-if="!isMenuOpen" name="i-heroicons-bars-3" />
                    <UIcon class="text-green-400 " v-else name="i-heroicons-x-mark" />
                </UButton>
            </nav>
        </UContainer>

        <!-- Mobile menu -->
        <Transition name="menu">
            <UContainer v-show="isMenuOpen"
                class="border-b border-b-green-600 md:hidden fixed top-0 left-0 z-30 w-full pt-14 bg-white dark:bg-[#121212]">
                <div class="flex flex-col space-y-2 py-4 items-center gap-4">
                    <UButton :ui="{ base: 'flex flex-col gap-2' }" v-for="link in navLinks" :key="link.to" :to="link.to"
                        color="gray" variant="ghost" block @click="isMenuOpen = false">
                        {{ link.label }}
                        <UDivider />
                    </UButton>
                    <UButton :ui="{ base: 'flex flex-col gap-2' }" v-if="isAuthenticated" @click="logout" color="gray"
                        variant="ghost" block>
                        {{ t('auth.logout') }}
                        <UDivider />
                    </UButton>

                    <LocalesSwitcher />
                    <ToggleTheme />
                </div>
            </UContainer>
        </Transition>




        <main class=" flex-grow w-full max-w-[750px] xl:max-w-[1024px] mt-20 flex flex-col">
            <UButton v-if="isAuthenticated && activeGameId && !isGamePage" :to="`/game/${activeGameId}`" color="primary"
                variant="soft" class=" w-80 h-10 text-center self-center">
                {{ t('game.returnToGame') }}
            </UButton>
            <UContainer
                class="mx-0 py-4 sm:px-2 max-w-[750px] xl:max-w-[1024px] flex flex-col justify-center items-center">
                <NuxtPage />
            </UContainer>
            <FloatingChat />
            <FloatingFriends />
        </main>

        <footer class="py-4 mt-auto">
            <UContainer class="text-center">
                <p>{{ t('misc.copyright', { year: new Date().getFullYear() }) }}</p>
            </UContainer>
        </footer>
        <UButton v-if="isAuthenticated && !chatStore.isOpen" @click="toggleChat" color="primary" variant="soft"
            size="xl" icon="i-heroicons-chat-bubble-left-ellipsis" class="fixed w-28 right-4 bottom-4">
            {{ t('chat.chat') }}
            <!-- <UBadge v-if="chatStore.unreadMessagesCount > 0" :label="chatStore.unreadMessagesCount" color="red"
                class="absolute -top-2 -right-2" size="sm" /> -->
        </UButton>
    </div>
    <GameDurationSelector v-if="invitationStore.showDurationSelector" :selected-user="invitationStore.infoInvitation"
        @close="handleDurationSelectorClose" />
    <GameInvitationNotification />
    <!-- <debug /> используется для логов не мобилке -->
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useUserStore } from '~/stores/user';
import { useGameStore } from '~/stores/game';
import { useChatStore } from '#imports';
import { useInvitationStore } from '~/stores/invitation';
import { computed, ref } from 'vue';
import FloatingChat from '~/features/chat/ui/FloatingChat.vue';
import ToggleTheme from '~/features/toggleTheme/ui/ToggleTheme.vue'
import LocalesSwitcher from '~/features/locales/ui/LocalesSwitcher.vue';
import FloatingFriends from '~/features/friends/ui/FloatingFriends.vue';
import GameDurationSelector from '~/features/game/ui/GameDurationSelector.vue';
import GameInvitationNotification from '~/features/invite/GameInvitationNotification.vue';
import debug from '~/features/debug.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const userStore = useUserStore();
const gameStore = useGameStore();
const chatStore = useChatStore();
const invitationStore = useInvitationStore();


const route = useRoute();

const handleDurationSelectorClose = () => {
    invitationStore.closeDurationSelector();
};

const { isAuthenticated } = useAuth();
const isMenuOpen = ref(false);

const isGamePage = computed(() => {
    return route.path.startsWith('/game/');
});

const activeGameId = computed(() => {
    const currentGame = gameStore.currentGame;

    return currentGame && currentGame.status === 'active' ? currentGame._id : null;
});
console.log(isGamePage.value)
console.log(activeGameId.value)
console.log(isAuthenticated.value)
const navLinks = computed(() => [
    { label: t('misc.home'), to: '/' },
    ...(isAuthenticated.value
        ? [{ label: t('profile.profile'), to: `/profile/${userStore.user?._id}` }]
        : [
            { label: t('auth.login'), to: '/login' },
            { label: t('auth.register'), to: '/register' },
        ]),
]);

const logout = async () => {
    await userStore.updateUserStatus(userStore._id!, false, false);
    await authStore.logout();
    isMenuOpen.value = false;
};

const toggleChat = () => {
    chatStore.toggleChat();
};

</script>

<style scoped>
.menu-enter-active,
.menu-leave-active {
    transition: all 0.3s ease;
}

.menu-enter-from,
.menu-leave-to {
    transform: translateY(-100%);
}
</style>