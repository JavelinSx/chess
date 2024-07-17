<template>
    <form @submit.prevent="handleLogin">
        <Input v-model="email" type="email" placeholder="Email" required />
        <Input v-model="password" type="password" placeholder="Password" required />
        <Button type="submit">Login</Button>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '~/client/composables/useAuth';

const email = ref('');
const password = ref('');
const { login } = useAuth();

const handleLogin = async () => {
    await login(email.value, password.value);
};
</script>