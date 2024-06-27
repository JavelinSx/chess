export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', '@pinia-plugin-persistedstate/nuxt'],
  piniaPersistedstate: {
    cookieOptions: {
      sameSite: 'strict',
    },
    storage: 'localStorage',
  },
  imports: {
    dirs: ['shared/**', 'entities/**', 'features/**', 'widgets/**'],
  },
  srcDir: 'src/',
  dir: {
    pages: 'pages',
  },
  components: [
    {
      path: '~/shared/ui',
      pathPrefix: false,
    },
    {
      path: '~/entities',
      pathPrefix: false,
    },
    {
      path: '~/features',
      pathPrefix: false,
    },
    {
      path: '~/widgets',
      pathPrefix: false,
    },
  ],
  css: ['~/assets/global.scss'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "~/assets/variables.scss";',
        },
      },
    },
  },
  alias: {
    '@': '/src',
  },
  typescript: {
    strict: true,
    typeCheck: true,
    shim: false,
  },
  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:3001', // URL вашего сервера
        changeOrigin: true,
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
    },
  },
});
