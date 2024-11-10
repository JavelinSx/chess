import svgLoader from 'vite-svg-loader';
import 'dotenv/config';

export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@pinia-plugin-persistedstate/nuxt', '@nuxt/ui', '@nuxtjs/i18n'],
  plugins: ['~/plugins/auth'],
  css: ['~/app/styles/global.css'],
  devServer: {
    port: 80, // Изменяем порт на 80
    host: 'localhost',
  },
  nitro: {
    plugins: ['~/server/db/index.ts'],
    experimental: {
      websocket: true,
    },
    routeRules: {
      '/api/auth/github/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Credentials': 'true',
        },
      },
    },
  },

  i18n: {
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: 'en.json',
      },
      {
        code: 'ru',
        iso: 'ru-RU',
        file: 'ru.json',
      },
    ],
    langDir: 'locales',
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
      githubClientId: process.env.GITHUB_CLIENT_ID,
      githubRedirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback',
    },
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chess_game',
    jwtSecret: process.env.JWT_SECRET || 'your_secret_key_here',
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  },

  ssr: false,

  app: {
    head: {
      title: 'ChessNexus',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'ChessNexus - Your Online Chess Platform' },
        { name: 'vk-id-app', content: '52638335' }, // Ваш ID приложения
      ],
    },
  },

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
