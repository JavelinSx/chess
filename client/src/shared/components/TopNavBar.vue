<template>
    <nav class="navbar">
        <div class="navbar-container">
            <div class="logo">ChessApp</div>
            <div class="menu-toggle" @click="toggleMenu">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
            </div>
            <ul class="navbar-list" :class="{ 'active': isMenuOpen }">
                <li class="navbar-item">
                    <NuxtLink to="/">Главная</NuxtLink>
                </li>
                <li class="navbar-item">
                    <NuxtLink to="/profile">Профиль</NuxtLink>
                </li>
                <li class="navbar-item">
                    <NuxtLink to="/chess">Игра</NuxtLink>
                </li>
            </ul>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isMenuOpen = ref(false);

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
};
</script>

<style lang="scss" scoped>
.navbar {
    background-color: #2c3e50;
    padding: 1rem;

    .navbar-container {
        display: flex;
        justify-content: start;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
    }

    .logo {
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
    }

    .navbar-list {
        display: flex;
        list-style-type: none;
        margin: 0;
        padding: 0;
        padding-left: 100px;

        .navbar-item {
            margin-left: 1rem;

            a {
                color: white;
                text-decoration: none;
                font-size: 1rem;
                transition: color 0.3s ease;

                &:hover {
                    color: #3498db;
                }
            }
        }
    }

    .menu-toggle {
        display: none;
        flex-direction: column;
        cursor: pointer;

        .bar {
            width: 25px;
            height: 3px;
            background-color: white;
            margin: 3px 0;
            transition: 0.4s;
        }
    }

    @media (max-width: 768px) {
        .navbar-container {
            flex-wrap: wrap;
        }

        .menu-toggle {
            display: flex;
        }

        .navbar-list {
            flex-direction: column;
            width: 100%;
            display: none;

            &.active {
                display: flex;
            }

            .navbar-item {
                margin: 0.5rem 0;
            }
        }

        &.active {
            .bar:nth-child(1) {
                transform: rotate(-45deg) translate(-5px, 6px);
            }

            .bar:nth-child(2) {
                opacity: 0;
            }

            .bar:nth-child(3) {
                transform: rotate(45deg) translate(-5px, -6px);
            }
        }
    }
}
</style>