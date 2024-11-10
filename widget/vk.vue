<template>
    <div id="vk-container" class="vk-container">
        <div id="vk_auth" class="vk-auth"></div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuthStore } from '~/store/auth';
import { useUserStore } from '~/store/user';

const authStore = useAuthStore();
const userStore = useUserStore();
const isScriptLoaded = ref(false);

declare global {
    interface Window {
        VK: any;
        vkAsyncInit: () => void;
    }
}

function initVK() {
    if (!window.VK) {
        console.error('VK не инициализирован');
        return;
    }

    try {
        window.VK.init({
            apiId: 52638335
        });

        window.VK.Widgets.Auth('vk_auth', {
            width: 360,
            onAuth: async function (response: any) {
                try {
                    console.log('VK auth success:', response);
                    const apiResponse = await $fetch('/api/auth/vk', {
                        method: 'POST',
                        body: {
                            vkAuthData: {
                                uid: response.uid,
                                first_name: response.first_name,
                                last_name: response.last_name,
                                hash: response.hash
                            }
                        }
                    });

                    if (apiResponse.data) {
                        authStore.setIsAuthenticated(true);
                        userStore.setUser(apiResponse.data.user);
                        navigateTo('/');
                    }
                } catch (error) {
                    console.error('Error processing VK auth:', error);
                }
            },
            authUrl: 'http://localhost:3000/auth/vk/callback'
        });
    } catch (error) {
        console.error('Error initializing VK:', error);
    }
}

onMounted(() => {
    if (document.getElementById('vk-script')) {
        return;
    }

    const script = document.createElement('script');
    script.id = 'vk-script';
    script.src = "https://vk.com/js/api/openapi.js";
    script.async = true;

    script.onload = () => {
        isScriptLoaded.value = true;
        window.vkAsyncInit = initVK;

        // Пытаемся инициализировать сразу после загрузки
        if (window.VK) {
            setTimeout(initVK, 100);
        }
    };

    document.head.appendChild(script);
});
</script>

<style scoped>
.vk-container {
    width: 100%;
    margin-top: 10px;
    display: flex;
    justify-content: center;
}

.vk-auth {
    width: 360px;
    height: 50px;
}

:deep(iframe) {
    max-width: 360px !important;
}
</style>