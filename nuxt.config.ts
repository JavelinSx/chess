import svgLoader from 'vite-svg-loader';
import 'dotenv/config';

export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@pinia-plugin-persistedstate/nuxt', '@nuxt/ui', '@nuxtjs/i18n'],
  plugins: ['~/plugins/auth'],
  css: ['~/app/styles/global.css'],
  nitro: {
    plugins: ['~/server/db/index.ts'],
    routeRules: {
      '/api/auth/github/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Credentials': 'true',
        },
      },
      '/vk/**': {
        proxy: 'https://id.vk.com/**',
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
      apiBase: process.env.API_BASE || '/api',
      githubClientId: process.env.GITHUB_CLIENT_ID,
      githubRedirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback',
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
      vkClientId: process.env.VK_CLIENT_ID,
      vkRedirectUri: process.env.VK_REDIRECT_URI || 'http://localhost:3000/auth/vk/callback',
    },
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET || 'your_secret_key_here',
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    vkClientSecret: process.env.VK_CLIENT_SECRET,
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

  vite: {
    define: {
      'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
    },
    plugins: [svgLoader()],
  },

  typescript: {
    strict: true,
  },

  compatibilityDate: '2024-09-13',
});
