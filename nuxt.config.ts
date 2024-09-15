import svgLoader from 'vite-svg-loader';
import 'dotenv/config';

export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@pinia-plugin-persistedstate/nuxt', '@nuxt/ui', '@nuxtjs/i18n'],
  css: ['~/app/styles/global.css'],
  nitro: {
    plugins: ['~/server/db/index.ts'],
  },

  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', file: 'en.json' },
      { code: 'ru', iso: 'ru-RU', file: 'ru.json' },
    ],
    langDir: 'locales/',
    defaultLocale: 'ru',
    strategy: 'no_prefix',
  },

  components: {
    global: true,
    dirs: ['~/features'],
  },

  runtimeConfig: {
    public: {
      apiBase: '/api' || process.env.API_BASE,
    },
    mongodbUri: 'mongodb://localhost:27017/chess_game' || process.env.MONGODB_URI,
    jwtSecret: 'your_secret_key_here' || process.env.JWT_SECRET,
  },

  ssr: false,

  app: {
    head: {
      title: 'ChessNexus',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'ChessNexus - Your Online Chess Platform' },
      ],
    },
  },

  devtools: { enabled: true },

  vite: {
    define: {
      'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
    },
    plugins: [svgLoader()],
  },

  typescript: {
    strict: true,
  },

  build: {
    transpile: ['jsonwebtoken'],
  },

  compatibilityDate: '2024-09-13',
});
