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
      apiBase: process.env.API_BASE,
      mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chess_game',
    },
    private: {
      mongodbUri: process.env.MONGODB_URI,
      jwtSecret: process.env.JWT_SECRET,
    },
  },

  ssr: false,
  compatibilityDate: '2024-08-07',
});
