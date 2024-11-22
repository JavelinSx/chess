<template>
    <div class="flex items-center md:ml-4">
        <!-- Кнопка для выбора русского языка -->
        <UButton :color="locale === 'ru' ? 'violet' : 'gray'" :variant="locale === 'ru' ? 'solid' : 'outline'" size="md"
            @click="setLocale('ru')">
            Ru
        </UButton>

        <!-- Вертикальный разделитель -->
        <UDivider orientation="vertical" class="mx-2" :ui="{
            border: {
                base: 'flex border-gray-700 dark:border-gray-200 h-[30px]'
            }
        }" />

        <!-- Кнопка для выбора английского языка -->
        <UButton :color="locale === 'en' ? 'violet' : 'gray'" :variant="locale === 'en' ? 'solid' : 'outline'" size="md"
            @click="setLocaleClient('en')">
            En
        </UButton>
    </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'

// Используем $i18n для получения текущего языка
const { locales, locale, setLocale } = useI18n()

// Активный и неактивный классы для кнопок
const activeClass = 'bg-violet-500 text-white rounded-md'
const inactiveClass = 'bg-gray-200 text-black rounded-md hover:bg-gray-300'

// Функция для смены языка
const setLocaleClient = (newLocale) => {
    setLocale(newLocale)
}
</script>