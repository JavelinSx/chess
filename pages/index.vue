<template>
    <div>
        <h1>Welcome to Chess Game</h1>
        <p v-if="authStore.isAuthenticated">
            Hello, {{ authStore.user?.username }}!
        </p>
        <p v-else>
            <NuxtLink to="/login">Login</NuxtLink> or
            <NuxtLink to="/register">Register</NuxtLink> to start playing.
        </p>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../store/auth';

const authStore = useAuthStore()
</script>