export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@pinia-plugin-persistedstate/nuxt'],
  css: ['~/app/styles/global.css'],
  nitro: {
    plugins: ['~/server/db/index.ts'],
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
});
