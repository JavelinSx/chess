<template>
    <form @submit.prevent="handleSubmit" class="edit-profile-form">
        <div class="form-group">
            <label for="username">Имя пользователя:</label>
            <input id="username" v-model="form.username" type="text" required class="chess-input">
        </div>
        <div class="form-group">
            <label for="email">Email:</label>
            <input id="email" v-model="form.email" type="email" required class="chess-input">
        </div>
        <div class="form-actions">
            <button type="submit" class="chess-button">Сохранить</button>
            <button type="button" @click="cancel" class="chess-button cancel-button">Отмена</button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '~/stores/user/userStore';
import type { IUpdateProfileData } from '~/types/user/types';

const userStore = useUserStore();

const form = ref<IUpdateProfileData>({
    username: userStore.user?.username || '',
    email: userStore.user?.email || ''
});

const handleSubmit = async () => {
    try {
        await userStore.updateProfile(form.value);
        userStore.setEditingMode(false);
    } catch (error) {
        console.error('Failed to update profile:', error);
        // Здесь можно добавить обработку ошибок, например, показать уведомление пользователю
    }
};

const cancel = () => {
    userStore.setEditingMode(false);
};
</script>

<style lang="scss" scoped>
.edit-profile-form {
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1rem;

    label {
        display: block;
        margin-bottom: 0.5rem;
        color: $text-color;
    }
}

.form-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
}

.cancel-button {
    background-color: $primary-color;

    &:hover {
        background-color: darken($secondary-color, 10%);
    }
}
</style>