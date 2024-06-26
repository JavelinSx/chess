export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', 'nuxt-lodash', '@pinia-plugin-persistedstate/nuxt'],
  pinia: {
    autoImports: [
      // automatically imports `defineStore`
      'defineStore', // import { defineStore } from 'pinia'
      ['defineStore', 'definePiniaStore'], // import { defineStore as definePiniaStore } from 'pinia'
    ],
  },
  piniaPersistedstate: {
    cookieOptions: {
      sameSite: 'strict',
    },
    storage: 'localStorage',
  },
  imports: {
    dirs: ['src/shared/**', 'src/entities/**', 'src/features/**', 'src/widgets/**'],
  },
  dir: {
    pages: 'src/pages',
  },
  components: [
    {
      path: '~/src/shared/ui',
      pathPrefix: false,
    },
    {
      path: '~/src/entities',
      pathPrefix: false,
    },
    {
      path: '~/src/features',
      pathPrefix: false,
    },
    {
      path: '~/src/widgets',
      pathPrefix: false,
    },
  ],
  css: ['@/assets/global.scss'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@/assets/variables.scss";',
        },
      },
    },
  },
  lodash: {
    prefix: '_',
    prefixSkip: ['string'],
    upperAfterPrefix: false,
    exclude: ['map'],
    alias: [
      ['camelCase', 'stringToCamelCase'],
      ['kebabCase', 'stringToKebab'],
      ['isDate', 'isLodashDate'],
    ],
  },
  alias: {
    '@': '/src',
  },
  typescript: {
    strict: true,
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        strict: true,
        types: ['@pinia/nuxt'],
      },
    },
  },
}); // Временно используем 'as any' для обхода проблем с типизацией
