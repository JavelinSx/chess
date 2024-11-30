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
            keyframes: {
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-1deg)' },
                    '50%': { transform: 'rotate(1deg)' },
                },
                wiggleMiddle: {
                    '0%': { transform: 'rotate(-1deg) translate(-1px, -1px)' },
                    '25%': { transform: 'rotate(0deg) translate(1px, 0px)' },
                    '50%': { transform: 'rotate(1deg) translate(-1px, 1px)' },
                    '75%': { transform: 'rotate(0deg) translate(0px, -1px)' },
                    '100%': { transform: 'rotate(-1deg) translate(-1px, -1px)' }
                },
                aroundY: {
                    '0%, 100%': { transform: 'rotateY(-360deg)' },
                    '50%': { transform: 'rotateY(360deg)' }
                },

            },
            animation: {
                wiggle: 'wiggle 1s ease-in-out infinite',
                wiggleMiddle: 'wiggleMiddle .8s ease-in-out infinite',
                aroundY: 'aroundY 20s ease-in-out infinite'
            }
        },
    },
    plugins: [

    ],
}