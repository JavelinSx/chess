<template>
    <div id="VkIdSdkOneTap" @click="handleClick"></div>
</template>

<script setup lang="ts">
import * as VKID from '@vkid/sdk';
const config = useRuntimeConfig();
const appId = parseInt(config.public.vkClientId);
const redirectUrl = config.public.vkRedirectUri;
const router = useRouter();
const { t } = useI18n();
const isLoading = ref(false);

interface responsePKCE {
    data: {
        state: string;
        codeChallenge: string;
        codeVerifier: string;
    }
}

onMounted(async () => {
    try {
        const response = await $fetch<responsePKCE>('/api/auth/vk/init', {
            method: 'POST'
        });

        if (!response.data) {
            throw new Error('Failed to initialize VK auth');
        }

        const { state, codeChallenge, codeVerifier } = response.data;

        // Сохраняем параметры 
        localStorage.setItem('vk_code_verifier', codeVerifier);
        localStorage.setItem('vk_state', state);

        VKID.Config.init({
            app: appId,
            redirectUrl: redirectUrl,
            state: state,
            codeChallenge: codeChallenge,
            scope: 'profile email',
        });

        const oneTap = new VKID.OneTap();
        const container = document.getElementById('VkIdSdkOneTap');

        if (container) {
            oneTap.render({
                container: container,
                scheme: VKID.Scheme.LIGHT,
                lang: VKID.Languages.RUS,
            });
        }
    } catch (error) {
        console.error('VK SDK initialization error:', error);
    }
});

async function handleClick() {
    try {
        if (isLoading.value) return;
        isLoading.value = true;

        await VKID.Auth.login();
    } catch (error) {
        console.error('VK auth error:', error);
    } finally {
        isLoading.value = false;
    }
}
</script>

<style scoped>
#VkIdSdkOneTap {
    width: 100%;
    min-height: 40px;
}
</style>