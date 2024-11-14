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

// Перехватываем и игнорируем ошибки SDK
const handleError = (error: any) => {
    // Игнорируем ошибки статистики
    if (error?.message?.includes('stat_events_vkid_sdk')) {
        return;
    }
}
onMounted(async () => {
    try {
        VKID.Config.init({
            app: appId,
            redirectUrl: redirectUrl,
        });

        const oneTap = new VKID.OneTap();
        const container = document.getElementById('VkIdSdkOneTap');

        if (container) {

            oneTap.render({
                container: container,
                scheme: VKID.Scheme.LIGHT,
                lang: VKID.Languages.RUS,

            }).on(VKID.WidgetEvents.ERROR, handleError);
        }
    } catch (error) {
        console.error('VK SDK initialization error:', error);
    }
});


async function handleClick() {
    try {
        if (isLoading.value) return;
        isLoading.value = true;

        // Инициируем процесс авторизации через бэкенд
        const response = await $fetch<responsePKCE>('/api/auth/vk/init', {
            method: 'POST'
        });

        const { state, codeChallenge, codeVerifier } = response.data;

        localStorage.setItem('codeChallenge', codeChallenge);
        localStorage.setItem('codeVerifier', codeVerifier);

        // Переинициализируем конфиг с новыми параметрами
        await VKID.Config.init({
            app: appId,
            redirectUrl: redirectUrl,
            state: state,
            codeChallenge: codeChallenge,
            scope: 'email phone nickname',
        });

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