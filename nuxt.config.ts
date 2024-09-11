import svgLoader from 'vite-svg-loader';
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@pinia-plugin-persistedstate/nuxt', '@nuxt/ui'],
  css: ['~/app/styles/global.css'],

  nitro: {
    plugins: ['~/server/db/index.ts'],
  },

  components: {
    global: true,
    dirs: ['~/features'],
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || '/api',
    },
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chess_game',
    jwtSecret: process.env.JWT_SECRET,
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
});
