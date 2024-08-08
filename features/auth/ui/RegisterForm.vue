<template>
    <form @submit.prevent="handleRegister">
        <Input v-model="username" placeholder="Username" required />
        <Input v-model="email" type="email" placeholder="Email" required />
        <Input v-model="password" type="password" placeholder="Password" required />
        <Button type="submit">Register</Button>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';

const username = ref('');
const email = ref('');
const password = ref('');
const { register } = useAuth();

const handleRegister = async () => {
    await register(username.value, email.value, password.value);
};
</script>