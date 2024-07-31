import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        // Здесь можно указать дополнительные опции Nuxt, если необходимо
      },
    },
  },
});
