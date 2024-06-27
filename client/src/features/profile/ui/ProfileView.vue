<template>
    <div class="profile-page">
        <div class="profile-container">
            <h1 class="profile-title">Профиль пользователя</h1>
            <div v-if="user && !userStore.isEditing" class="profile-info">
                <div v-for="(value, key) in userInfo" :key="key" class="profile-field">
                    <span class="field-label">{{ labels[key] }}:</span>
                    <span class="field-value">{{ value }}</span>
                </div>
            </div>
            <edit-profile-form v-else-if="userStore.isEditing" />
            <div v-else class="profile-loading">
                Загрузка профиля...
            </div>
            <div class="profile-actions" v-if="isEditing">
                <button @click="userStore.setEditingMode(!userStore.isEditing)" class="chess-button">
                    Редактировать профиль
                </button>
                <button @click="logout" class="chess-button logout-button">Выйти</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useUserStore } from '~/stores/user/userStore';
import { storeToRefs } from 'pinia';
import EditProfileForm from './EditProfileForm.vue';

const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const isEditing = computed(() => userStore.isEditing)
const userInfo = computed(() => {
    if (!user.value) return {};
    return {
        username: user.value.username,
        email: user.value.email,
        rating: user.value.rating,
        gamesPlayed: user.value.gamesPlayed,
        gamesWon: user.value.gamesWon,
        gamesLost: user.value.gamesLost,
        gamesDraw: user.value.gamesDraw,
        winRate: 0
    };
});

const labels = {
    username: 'Имя пользователя',
    email: 'Email',
    rating: 'Рейтинг',
    gamesPlayed: 'Сыграно игр',
    gamesWon: 'Победы',
    gamesLost: 'Поражения',
    gamesDraw: 'Ничьи',
    winRate: 'Процент побед'
};

onMounted(async () => {
    if (!user.value) {
        await userStore.fetchProfile();
    }
});

const logout = async () => {
    await userStore.logout();
    navigateTo('/auth');
};
</script>

<style lang="scss" scoped>
.profile-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: repeating-conic-gradient($secondary-color 0% 25%, $background-color 0% 50%) 50% / 50px 50px;
}

.profile-container {
    background: $background-color;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 500px;
}

.profile-title {
    color: $text-color;
    text-align: center;
    margin-bottom: 1.5rem;
    font-size: 2rem;
}

.profile-info {
    margin-bottom: 1.5rem;
}

.profile-field {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    background-color: lighten($secondary-color, 35%);
    border-radius: 4px;

    .field-label {
        font-weight: bold;
        color: $text-color;
    }

    .field-value {
        color: $text-color;
    }
}

.profile-loading {
    text-align: center;
    color: $text-color;
    font-style: italic;
}

.profile-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 1.5rem;
}

.logout-button {
    background-color: $error-color;

    &:hover {
        background-color: darken($error-color, 10%);
    }
}
</style>