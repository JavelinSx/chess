// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', 'nuxt-lodash'],

  imports: {
    dirs: [
      'shared/*',
      // Auto-import all files from shared directory. You can specify only need paths | https://nuxt.com/docs/guide/directory-structure/composables
    ],
  },

  dir: {
    pages: 'app/routes',
  },

  components: [
    {
      path: '~/shared',
      pathPrefix: false,
      // Auto-import all components from shared directory.
    },
  ],
  lodash: {
    prefix: '_',
    prefixSkip: ['string'],
    upperAfterPrefix: false,
    exclude: ['map'],
    alias: [
      ['camelCase', 'stringToCamelCase'], // => stringToCamelCase
      ['kebabCase', 'stringToKebab'], // => stringToKebab
      ['isDate', 'isLodashDate'], // => _isLodashDate
    ],
  },
});
