import antfu from '@antfu/eslint-config'
import { defineConfig } from 'eslint-define-config'

export default defineConfig({
  extends: antfu({
    unocss: true,
  }),
  rules: {
    'vue/html-indent': ['error', 4], // Устанавливает отступы в 4 пробела для HTML в файлах Vue
    'indent': ['error', 4], // Устанавливает отступы в 4 пробела для JavaScript
  },
})
