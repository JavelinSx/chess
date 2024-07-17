export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  css: ['~/app/styles/global.css'],
  nitro: {
    plugins: ['~/server/db/index.ts'],
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || '/api',
    },
    private: {
      mongodbUri: process.env.MONGODB_URI,
      jwtSecret: process.env.JWT_SECRET,
    },
  },
  compatibilityDate: '2024-07-17',
});
