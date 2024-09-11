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

    },
    plugins: [

    ],
}