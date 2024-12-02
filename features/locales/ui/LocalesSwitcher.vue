<template>
    <div class="flex items-center md:ml-4">
        <!-- Кнопка для выбора русского языка -->
        <UButton :color="locale === 'ru' ? 'violet' : 'gray'" :variant="locale === 'ru' ? 'solid' : 'outline'" size="md"
            @click="setLocaleClient('ru')">
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
import { useI18n } from 'vue-i18n';
import { onMounted } from 'vue';

// Подключаем i18n
const { locale, setLocale } = useI18n();

// Функция для смены языка
const setLocaleClient = (newLocale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale); // Сохраняем выбор в localStorage
};

// Устанавливаем язык при загрузке компонента
onMounted(() => {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale) {
        setLocale(savedLocale);
    }
});
</script>
