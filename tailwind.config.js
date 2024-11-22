/** @type {import('tailwindcss').Config} */
module.exports = {
    app: {
        pageTransition: { name: 'page', mode: 'out-in' },
    },
    darkMode: 'class',
    content: [
        "./features/**/*.{vue,ts}",
        "./layouts/**/*.vue",
        "./pages/**/*.vue",
        "./plugins/**/*.{js,ts}",
        "./app.vue",
        "./error.vue",
    ],
    theme: {
        extend: {
            screens: {
                sm: '300px', // Меняем минимальную ширину для 'sm'
                md: '800px', // Меняем минимальную ширину для 'md'
                lg: '1024px', // Оставляем без изменений
                xl: '1440px', // Меняем минимальную ширину для 'xl'
                '2xl': '1600px', // Меняем минимальную ширину для '2xl'
            },
        },
    },
    plugins: [

    ],
}