export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', 'nuxt-lodash'],

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
  },
});
